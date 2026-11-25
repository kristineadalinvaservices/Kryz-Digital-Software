/**
 * End-to-end test: loads the e2e build (dist-e2e) into Chromium and exercises the real extension.
 * Writes a machine-readable report to tests/e2e/last-run.json and screenshots to tests/e2e/screenshots/.
 * Run with: npm run test:e2e
 */
import { createRequire } from 'node:module';
// Playwright may be installed globally (CI images) or locally; resolve either way.
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const extPath = resolve(root, 'dist-e2e');
const shots = resolve(here, 'screenshots');
mkdirSync(shots, { recursive: true });

const results = [];
let failed = 0;
async function step(name, fn) {
  const started = Date.now();
  try {
    const note = await fn();
    results.push({ name, status: 'pass', ms: Date.now() - started, note: note ?? undefined });
    console.log(`  ✓ ${name}${note ? ` — ${note}` : ''}`);
  } catch (e) {
    failed++;
    results.push({ name, status: 'fail', ms: Date.now() - started, error: String(e?.message ?? e) });
    console.log(`  ✗ ${name}\n      ${String(e?.message ?? e).split('\n')[0]}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---------- local test site ----------
const testPage = readFileSync(resolve(here, 'test-page.html'), 'utf8');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(testPage);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const site = `http://localhost:${port}`;

// ---------- launch ----------
const userDataDir = mkdtempSync(join(tmpdir(), 'kqr-e2e-'));
const external = [];
const cspErrors = [];
async function launch() {
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium', // full Chromium (new headless) supports extensions; headless-shell does not
    args: [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`],
    viewport: { width: 1280, height: 860 },
  });
  ctx.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('chrome-extension://') && !u.startsWith(site) && !u.startsWith(`http://127.0.0.1:${port}`) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
  });
  ctx.on('page', (p) =>
    p.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) cspErrors.push(m.text());
    }),
  );
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const id = new URL(sw.url()).host;
  return { ctx, sw, id };
}

let { ctx, sw, id } = await launch();
const ext = (p) => `chrome-extension://${id}/${p}`;
console.log(`Extension ${id}; test site ${site}`);

async function dashboard(hash) {
  const page = await ctx.newPage();
  await page.goto(ext(`dashboard.html${hash}`));
  return page;
}
const storage = (page) => page.evaluate(() => chrome.storage.local.get(null));

// ---------- tests ----------
let dash;
await step('Onboarding opens automatically on install', async () => {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !ctx.pages().some((p) => p.url().includes('#/welcome'))) await new Promise((r) => setTimeout(r, 100));
  dash = ctx.pages().find((p) => p.url().includes('#/welcome'));
  assert(dash, 'welcome tab not opened');
  await dash.waitForSelector('text=Before you start');
});

await step('Consent checkboxes are not preselected and gate "Get started"', async () => {
  const boxes = dash.locator('.check input[type=checkbox]');
  assert((await boxes.count()) === 3, 'expected privacy, terms, starter checkboxes');
  for (let i = 0; i < 3; i++) assert(!(await boxes.nth(i).isChecked()), `checkbox ${i} preselected`);
  const btn = dash.getByRole('button', { name: 'Get started' });
  assert(await btn.isDisabled(), 'Get started enabled without consent');
  await boxes.nth(0).check();
  assert(await btn.isDisabled(), 'enabled with only privacy acknowledged');
  await dash.screenshot({ path: join(shots, 'onboarding.png'), fullPage: true });
});

await step('Accepting records policy versions + dates and adds optional starter templates', async () => {
  const boxes = dash.locator('.check input[type=checkbox]');
  await boxes.nth(1).check();
  await boxes.nth(2).check();
  await dash.getByRole('button', { name: 'Get started' }).click();
  await dash.waitForSelector('text=Your');
  const s = await storage(dash);
  assert(s.consent.privacyAckVersion && s.consent.termsAcceptedVersion && s.consent.privacyAckAt > 0, 'consent not recorded');
  assert(s.templates.length === 13, `expected 13 starter templates, got ${s.templates.length}`);
  return `${s.templates.length} templates; privacy ${s.consent.privacyAckVersion}`;
});

await step('Legal documents render from bundled drafts', async () => {
  const p = await dashboard('#/legal/privacy');
  await p.waitForSelector('h1:has-text("Privacy Policy")');
  const t = await dashboard('#/legal/terms');
  await t.waitForSelector('h1:has-text("Terms of Use")');
  await p.close();
  await t.close();
});

await step('Create templates (with and without variables)', async () => {
  for (const [title, shortcut, body] of [
    ['E2E plain', '/plain', 'Plain text body'],
    ['E2E vars', '/e2evars', 'Hello {{first_name}} from E2E'],
  ]) {
    await dash.goto(ext('dashboard.html#/templates/new'));
    await dash.getByLabel('Title').fill(title);
    await dash.getByLabel('Shortcut (optional)').fill(shortcut);
    await dash.getByLabel('Message').fill(body);
    await dash.getByRole('button', { name: 'Create template' }).click();
    await dash.waitForSelector(`text=${title}`);
  }
});

await step('Duplicate shortcuts are detected in the editor', async () => {
  await dash.goto(ext('dashboard.html#/templates/new'));
  await dash.getByLabel('Shortcut (optional)').fill('/plain');
  await dash.waitForSelector('text=already used');
  assert(await dash.getByRole('button', { name: 'Create template' }).isDisabled(), 'save enabled with duplicate shortcut');
});

await step('Search filters the template list', async () => {
  await dash.goto(ext('dashboard.html#/templates'));
  await dash.getByPlaceholder('Search titles, messages, tags and shortcuts').fill('invoice');
  const n = await dash.locator('.tpl').count();
  assert(n === 1, `expected 1 result, got ${n}`);
});

await step('Theme: Light → Kryz Signature applies instantly and persists without flash', async () => {
  await dash.goto(ext('dashboard.html#/settings'));
  await dash.getByLabel('Light', { exact: true }).check();
  await dash.screenshot({ path: join(shots, 'settings-light.png'), fullPage: true });
  await dash.getByLabel('Kryz Signature', { exact: true }).check();
  assert((await dash.evaluate(() => document.documentElement.dataset.theme)) === 'signature', 'not applied instantly');
  await dash.screenshot({ path: join(shots, 'settings-signature.png'), fullPage: true });
  const p = await ctx.newPage();
  let early = null;
  p.on('domcontentloaded', async () => {
    early = await p.evaluate(() => document.documentElement.dataset.theme).catch(() => null);
  });
  await p.goto(ext('dashboard.html#/templates'));
  await p.waitForSelector('.tpl');
  assert(early === 'signature', `theme at DOMContentLoaded was ${early}`);
  await p.screenshot({ path: join(shots, 'templates-signature.png'), fullPage: true });
  await p.close();
});

await step('System theme follows OS dark mode → Kryz Signature', async () => {
  await dash.getByLabel('System', { exact: true }).check();
  await dash.emulateMedia({ colorScheme: 'dark' });
  await dash.waitForFunction(() => document.documentElement.dataset.theme === 'signature');
  await dash.emulateMedia({ colorScheme: 'light' });
  await dash.waitForFunction(() => document.documentElement.dataset.theme === 'light');
});

await step('Enable shortcuts for the test site (registers expander only there)', async () => {
  await dash.goto(ext('dashboard.html#/settings'));
  await dash.getByPlaceholder('e.g. mail.google.com or www.linkedin.com').fill(site);
  await dash.getByRole('button', { name: 'Add site' }).click();
  await dash.waitForSelector(`text=${site}`);
  const regs = await sw.evaluate(() => chrome.scripting.getRegisteredContentScripts());
  assert(regs.length === 1 && regs[0].matches.join() === `${site}/*`, `unexpected registration ${JSON.stringify(regs)}`);
  return regs[0].matches.join();
});

let page;
await step('Expander: /plain + Tab expands in a textarea', async () => {
  page = await ctx.newPage();
  await page.goto(site);
  await page.click('#ta');
  await page.keyboard.type('Hi /plain');
  await page.waitForTimeout(150);
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => document.querySelector('#ta').value === 'Hi Plain text body');
});

await step('Expander: undo (Ctrl+Z) restores the typed shortcut', async () => {
  await page.keyboard.press('Control+z');
  const v = await page.$eval('#ta', (e) => e.value);
  assert(v.includes('/plain'), `undo result: ${JSON.stringify(v)}`);
  return JSON.stringify(v);
});

await step('Expander: variables open a personalization panel; inserted text is correct', async () => {
  await page.fill('#in', '');
  await page.click('#in');
  await page.keyboard.type('/e2evars');
  await page.waitForTimeout(150);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
  await page.keyboard.type('Ana');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#in').value === 'Hello Ana from E2E');
});

await step('Expander: contenteditable editor', async () => {
  await page.click('#ce');
  await page.keyboard.type('/plain');
  await page.waitForTimeout(150);
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => document.querySelector('#ce').textContent.includes('Plain text body'));
});

await step('Expander: Escape dismisses; Tab then behaves normally', async () => {
  await page.fill('#ta', '');
  await page.click('#ta');
  await page.keyboard.type('/plain');
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  const v = await page.$eval('#ta', (e) => e.value);
  assert(v === '/plain', `value after Esc+Tab: ${v}`);
});

for (const [sel, label] of [
  ['#pw', 'password field'],
  ['#user', 'username in sign-in form'],
  ['#cc', 'payment card field'],
  ['#otp', 'one-time code field'],
]) {
  await step(`Expander never operates in ${label}`, async () => {
    await page.click(sel);
    await page.keyboard.type('/plain');
    await page.waitForTimeout(150);
    await page.keyboard.press('Tab');
    const v = await page.$eval(sel, (e) => e.value);
    assert(v === '/plain', `${label} value changed to ${v}`);
  });
}

await step('Usage is recorded locally and shown in Analytics', async () => {
  await dash.goto(ext('dashboard.html#/analytics'));
  await dash.waitForSelector('text=Total template uses');
  const s = await storage(dash);
  const total = Object.values(s.usage.byTemplate).reduce((n, v) => n + v.count, 0);
  assert(total >= 3, `usage total ${total}`);
  await dash.screenshot({ path: join(shots, 'analytics.png'), fullPage: true });
  return `${total} uses recorded`;
});

await step('Popup lists templates and inserts into the focused page field', async () => {
  await page.bringToFront();
  await page.fill('#in', '');
  await page.click('#in');
  const popupPromise = ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  await sw.evaluate(() => chrome.action.openPopup()).catch(() => null);
  let popup = await popupPromise;
  let note = 'opened via chrome.action.openPopup()';
  if (!popup) {
    // Fallback: popup page in a tab. The active tab is then the popup itself, so only list/search UI is checked.
    popup = await ctx.newPage();
    await popup.goto(ext('popup.html'));
    note = 'openPopup unavailable in headless; popup page opened in a background tab, Insert used on the active test tab';
  }
  await popup.waitForSelector('.tpl');
  await popup.screenshot({ path: join(shots, 'popup.png') });
  await popup.getByPlaceholder('Search templates, tags, shortcuts').fill('E2E plain');
  assert((await popup.locator('.tpl').count()) === 1, 'popup search failed');
  if (!note.startsWith('opened')) await page.bringToFront(); // make the test page the active tab again
  await popup.getByRole('button', { name: 'Insert E2E plain into the page' }).click();
  await page.waitForFunction(() => document.querySelector('#in').value === 'Plain text body', null, { timeout: 4000 });
  await popup.close().catch(() => undefined);
  return note;
});

await step('Import rejects malicious content safely (prototype pollution, oversized, wrong format)', async () => {
  await dash.goto(ext('dashboard.html#/import-export'));
  const evil = '{"format":"kryz-quick-reply","schemaVersion":1,"__proto__":{"polluted":1},"templates":[{"title":"<img src=x onerror=alert(1)>","body":"<script>alert(1)</script>"}]}';
  await dash.setInputFiles('input[type=file]', { name: 'evil.json', mimeType: 'application/json', buffer: Buffer.from(evil) });
  await dash.waitForSelector('text=1 templates, 0 folders found');
  await dash.getByRole('button', { name: 'Import', exact: true }).click();
  await dash.waitForSelector('text=Imported: 1 new');
  const polluted = await dash.evaluate(() => ({}).polluted);
  assert(polluted === undefined, 'prototype polluted');
  await dash.goto(ext('dashboard.html#/templates'));
  const imgCount = await dash.locator('.tpl img').count();
  assert(imgCount === 0, 'HTML from import was rendered');
  assert(await dash.locator('text=<script>alert(1)</script>').count() > 0, 'imported text not shown as text');
  await dash.goto(ext('dashboard.html#/import-export'));
  await dash.setInputFiles('input[type=file]', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"nope"}') });
  await dash.waitForSelector('text=This is not a Kryz Quick Reply export file.');
  await dash.setInputFiles('input[type=file]', { name: 'big.json', mimeType: 'application/json', buffer: Buffer.alloc(2.2 * 1024 * 1024, 32) });
  await dash.waitForSelector('text=larger than 2 MB');
});

await step('Export library produces a valid file', async () => {
  const [download] = await Promise.all([dash.waitForEvent('download'), dash.getByRole('button', { name: 'Export templates' }).click()]);
  const file = await download.path();
  const data = JSON.parse(readFileSync(file, 'utf8'));
  assert(data.format === 'kryz-quick-reply' && data.templates.length >= 15, 'bad export');
  return `${data.templates.length} templates exported`;
});

await step('Data persists after browser restart', async () => {
  const before = await storage(dash);
  await ctx.close();
  ({ ctx, sw, id } = await launch());
  dash = await dashboard('#/templates');
  await dash.waitForSelector('.tpl');
  const after = await storage(dash);
  assert(after.templates.length === before.templates.length, 'template count changed');
  assert(after.settings.theme === before.settings.theme, 'theme changed');
  const regs = await sw.evaluate(() => chrome.scripting.getRegisteredContentScripts());
  assert(regs.length === 1, 'expander registration lost');
  return `${after.templates.length} templates after restart`;
});

await step('Privacy Center shows verified status and site access', async () => {
  await dash.goto(ext('dashboard.html#/privacy'));
  for (const t of ['Cloud synchronization', 'External analytics', 'Advertising trackers', 'AI processing']) await dash.waitForSelector(`text=${t}`);
  await dash.screenshot({ path: join(shots, 'privacy-center.png'), fullPage: true });
});

await step('Removing a site disables expansion there immediately', async () => {
  await dash.goto(ext('dashboard.html#/settings'));
  await dash.getByRole('button', { name: /Remove/ }).click();
  await dash.waitForSelector('text=No sites yet');
  const regs = await sw.evaluate(() => chrome.scripting.getRegisteredContentScripts());
  assert(regs.length === 0, 'expander still registered');
  page = await ctx.newPage();
  await page.goto(site);
  await page.click('#ta');
  await page.keyboard.type('/plain');
  await page.waitForTimeout(200);
  await page.keyboard.press('Tab');
  assert((await page.$eval('#ta', (e) => e.value)) === '/plain', 'expanded after removal');
});

await step('Delete all data requires typed confirmation and erases everything', async () => {
  await dash.goto(ext('dashboard.html#/privacy'));
  await dash.getByRole('button', { name: 'Delete all extension data' }).click();
  const confirm = dash.getByRole('button', { name: 'Delete everything' });
  assert(await confirm.isDisabled(), 'confirm enabled before typing');
  await dash.getByLabel('Type DELETE to confirm').fill('DELETE');
  await confirm.click();
  await dash.waitForSelector('text=Before you start');
  const s = await storage(dash);
  assert(Object.keys(s).length === 0, `storage not empty: ${Object.keys(s)}`);
  const ls = await dash.evaluate(() => localStorage.getItem('kqr-theme'));
  assert(ls === null, 'theme mirror not cleared');
});

await step('Extension pages produced no CSP violations', async () => {
  assert(cspErrors.length === 0, cspErrors.join('\n'));
});

await step('No network requests left the device (only local test site + extension files)', async () => {
  assert(external.length === 0, `external requests: ${external.slice(0, 5).join(', ')}`);
  return 'external requests: 0';
});

await ctx.close();
server.close();
rmSync(userDataDir, { recursive: true, force: true });

const report = {
  date: new Date().toISOString(),
  chromium: chromium.name(),
  passed: results.filter((r) => r.status === 'pass').length,
  failed,
  results,
};
writeFileSync(resolve(here, 'last-run.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
