/**
 * Generates Chrome Web Store images from the REAL extension with demo data:
 *   docs/store/assets/screenshot-1..5.png (1280x800), promo-small-440x280.png, promo-marquee-1400x560.png
 * Run after `npm run build` and `npm run build:e2e`. Final PNGs are flattened to 24-bit (no alpha) by
 * scripts/flatten-png.py. Demo names only (Maria, Acme Studio, Alex Rivera); no real people or brands.
 */
import { createRequire } from 'node:module';
import http from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = mkdtempSync(join(tmpdir(), 'kqr-raw-'));
const out = resolve(root, 'docs/store/assets');
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(extDir) {
  const userDataDir = mkdtempSync(join(tmpdir(), 'kqr-assets-'));
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const id = new URL(sw.url()).host;
  const ext = (p) => `chrome-extension://${id}/${p}`;
  // Onboard
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !ctx.pages().some((p) => p.url().includes('#/welcome'))) await sleep(100);
  const page = ctx.pages().find((p) => p.url().includes('#/welcome')) ?? (await ctx.newPage());
  if (!page.url().includes('#/welcome')) await page.goto(ext('dashboard.html#/welcome'));
  const boxes = page.locator('.check input[type=checkbox]');
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await boxes.nth(2).check();
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.waitForSelector('.tpl');
  await page.evaluate(async () => {
    const { settings } = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({ settings: { ...settings, profile: { senderName: 'Alex Rivera', meetingLink: 'https://cal.example.com/alex' } } });
  });
  return { ctx, page, ext, userDataDir };
}

async function setTheme(page, theme) {
  await page.evaluate(async (t) => {
    const { settings } = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({ settings: { ...settings, theme: t } });
    localStorage.setItem('kqr-theme', t);
  }, theme);
}

// ---------- Part A: dashboard screens (production build: no test permissions) ----------
{
  const { ctx, page, ext, userDataDir } = await launch(resolve(root, 'dist'));
  // Demo usage so Analytics has something to show (illustrative, local only).
  await page.evaluate(async () => {
    const { templates } = await chrome.storage.local.get('templates');
    const pick = (t) => templates.find((x) => x.title === t);
    const byTemplate = {};
    const uses = [['Sales follow-up', 14], ['Discovery call invitation', 9], ['LinkedIn outreach', 8], ['Invoice reminder', 5], ['Interview invitation', 4]];
    const byFolder = {};
    let total = 0;
    for (const [title, n] of uses) {
      const t = pick(title);
      byTemplate[t.id] = { count: n, words: n * 70, lastUsedAt: Date.now() };
      byFolder[t.folderId] = (byFolder[t.folderId] ?? 0) + n;
      total += n;
    }
    const byDay = {};
    const per = [3, 6, 4, 7, 5, 9, 6];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      byDay[k] = { count: per[i], words: per[i] * 70 };
    }
    await chrome.storage.local.set({ usage: { byTemplate, byDay, byFolder } });
    // Favorite and pin a couple so the list looks lived in.
    const ts = templates.map((t) => (t.title === 'Sales follow-up' ? { ...t, pinned: true, favorite: true } : t.title === 'Discovery call invitation' ? { ...t, favorite: true } : t));
    await chrome.storage.local.set({ templates: ts });
  });

  await setTheme(page, 'signature');
  await page.goto(ext('dashboard.html#/templates'));
  await page.reload();
  await page.waitForSelector('.tpl');
  await sleep(400);
  await page.screenshot({ path: join(raw, 'templates-signature.png') });

  // Personalize modal on a template
  await page.locator('.tpl', { hasText: 'Discovery call invitation' }).getByRole('button', { name: 'Personalize & copy' }).click();
  await page.waitForSelector('.modal');
  const inputs = page.locator('.modal input.input');
  const n = await inputs.count();
  const demo = { 'First name': 'Maria', Company: 'Acme Studio' };
  for (let i = 0; i < n; i++) {
    const label = (await inputs.nth(i).locator('xpath=..').locator('.label').innerText()).split('·')[0].trim();
    if (demo[label]) await inputs.nth(i).fill(demo[label]);
  }
  await sleep(300);
  await page.screenshot({ path: join(raw, 'personalize-signature.png') });
  await page.keyboard.press('Escape');

  await page.goto(ext('dashboard.html#/privacy'));
  await page.waitForSelector('text=Cloud synchronization');
  await sleep(300);
  await page.screenshot({ path: join(raw, 'privacy-signature.png') });

  await setTheme(page, 'light');
  await page.goto(ext('dashboard.html#/analytics'));
  await page.reload();
  await page.waitForSelector('text=Total template uses');
  await sleep(400);
  await page.screenshot({ path: join(raw, 'analytics-light.png') });

  // Popup (light)
  const popup = await ctx.newPage();
  await popup.setViewportSize({ width: 380, height: 600 });
  await popup.goto(ext('popup.html'));
  await popup.waitForSelector('.tpl');
  await sleep(300);
  await popup.screenshot({ path: join(raw, 'popup-light.png') });
  await setTheme(popup, 'signature');
  await popup.reload();
  await popup.waitForSelector('.tpl');
  await sleep(300);
  await popup.screenshot({ path: join(raw, 'popup-signature.png') });

  await ctx.close();
  rmSync(userDataDir, { recursive: true, force: true });
}

// ---------- Part B: shortcut expanding on a neutral demo page (e2e build has localhost access) ----------
{
  const demoPage = `<!doctype html><html><head><meta charset="utf-8"><title>Messages</title><style>
    body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#eef0f3;color:#1f2328}
    .app{display:grid;grid-template-columns:260px 1fr;height:100vh}
    .side{background:#fff;border-right:1px solid #dde1e6;padding:20px}
    .side h2{font-size:15px;margin:0 0 14px}
    .c{padding:10px;border-radius:10px;margin-bottom:6px}.c.on{background:#e8ecf2}
    .c b{display:block;font-size:14px}.c span{font-size:12px;color:#667}
    .main{padding:28px 36px;display:flex;flex-direction:column;gap:14px}
    .bubble{background:#fff;border:1px solid #dde1e6;border-radius:14px;padding:12px 16px;max-width:560px}
    textarea{width:100%;height:220px;border:1px solid #c9ced6;border-radius:12px;padding:14px;font:15px/1.5 system-ui,sans-serif;resize:none;box-sizing:border-box}
    label{font-size:13px;color:#556}
  </style></head><body><div class="app"><div class="side"><h2>Messages</h2>
  <div class="c on"><b>Maria · Acme Studio</b><span>Thanks for the proposal!</span></div>
  <div class="c"><b>Jordan Lee</b><span>Can we move our call?</span></div>
  <div class="c"><b>Priya N.</b><span>Invoice received, thank you</span></div></div>
  <div class="main"><div class="bubble"><b>Maria</b><br>Thanks for the proposal! Let me review it with the team this week.</div>
  <label for="m">Reply</label><textarea id="m"></textarea></div></div></body></html>`;
  const server = http.createServer((_, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(demoPage);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const site = `http://localhost:${server.address().port}`;
  const { ctx, page, userDataDir } = await launch(resolve(root, 'dist-e2e'));
  await page.goto(page.url().replace(/#.*/, '#/settings'));
  await page.getByPlaceholder('e.g. mail.google.com or www.linkedin.com').fill(site);
  await page.getByRole('button', { name: 'Add site' }).click();
  await page.waitForSelector(`text=${site}`);
  const p = await ctx.newPage();
  await p.goto(site);
  await p.click('#m');
  await p.keyboard.type('Hi Maria,\n\n/followup');
  await sleep(400);
  await p.screenshot({ path: join(raw, 'shortcut-chip.png') });
  await p.keyboard.press('Tab');
  await sleep(400);
  await p.keyboard.type('Maria');
  await p.keyboard.press('Tab');
  await p.keyboard.type('the proposal');
  await p.keyboard.press('Tab');
  await p.keyboard.type('Acme Studio');
  await p.keyboard.press('Tab');
  await p.keyboard.type('a weekly status email');
  await sleep(400);
  await p.screenshot({ path: join(raw, 'shortcut-panel.png') });
  await ctx.close();
  server.close();
  rmSync(userDataDir, { recursive: true, force: true });
}

// ---------- Part C: compose branded frames ----------
const f = (p) => pathToFileURL(resolve(root, p)).href;
const r = (name) => pathToFileURL(join(raw, name)).href;
const fonts = `
@font-face{font-family:Manrope;font-weight:800;src:url(${f('node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff2')})}
@font-face{font-family:Inter;font-weight:400;src:url(${f('node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2')})}
@font-face{font-family:Inter;font-weight:600;src:url(${f('node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2')})}
@font-face{font-family:'Instrument Serif';font-style:italic;src:url(${f('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')})}
*{box-sizing:border-box}html,body{margin:0}
body{background:#141012;color:#f3e9ec;font-family:Inter,sans-serif;overflow:hidden;position:relative}
.glow1{position:absolute;width:900px;height:900px;right:-320px;top:-420px;background:radial-gradient(circle,rgba(255,61,154,.35),transparent 62%)}
.glow2{position:absolute;width:700px;height:700px;left:-300px;bottom:-420px;background:radial-gradient(circle,rgba(255,210,63,.16),transparent 62%)}
h1{font-family:Manrope;font-weight:800;color:#fff9f7;letter-spacing:-.02em;margin:0;line-height:1.02}
em{font-family:'Instrument Serif';font-style:italic;font-weight:400;color:#ff3d9a;letter-spacing:0}
.sub{color:#bdaeb4}
.shot{border-radius:18px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 0 50px rgba(255,61,154,.28),0 24px 60px rgba(0,0,0,.55)}
.shot img{display:block;width:100%}
`;
const logo = f('brand/logo/kryz-logo-3d-glow-for-dark.png');

function screenshotFrame({ title, sub, img, crop = 0, popup }) {
  return `<html><head><style>${fonts}
  .head{position:absolute;left:72px;top:54px;width:1136px;display:flex;align-items:flex-end;gap:24px}
  .head h1{font-size:54px;flex:1}.head .sub{font-size:19px;max-width:380px;margin:0 0 6px}
  .main{position:absolute;left:72px;top:${popup ? 190 : 200}px;width:${popup ? 860 : 1136}px;height:${popup ? 640 : 640}px}
  .main .shot img{margin-top:-${crop}px}
  .pop{position:absolute;right:72px;top:190px;width:330px}
  .brand{position:absolute;right:56px;top:30px;height:70px}
  </style></head><body><div class="glow1"></div><div class="glow2"></div>
  <div class="head"><h1>${title}</h1><p class="sub">${sub}</p></div>
  <div class="main"><div class="shot"><img src="${img}"></div></div>
  ${popup ? `<div class="pop"><div class="shot"><img src="${popup}"></div></div>` : ''}
  </body></html>`;
}

const frames = [
  { file: 'screenshot-1.png', title: 'Write it once.<br>Reply in <em>seconds.</em>', sub: 'Your best messages, organized with folders, tags, favorites and pins.', img: r('templates-signature.png') },
  { file: 'screenshot-2.png', title: 'Personal, not <em>generic.</em>', sub: 'Fill in the details, check the preview, then copy or insert.', img: r('personalize-signature.png'), crop: 0 },
  { file: 'screenshot-3.png', title: 'Type /followup.<br>Press <em>Tab.</em>', sub: 'Shortcuts work only on sites you switch on, and never on password or payment fields.', img: r('shortcut-panel.png') },
  { file: 'screenshot-4.png', title: 'Your data. Your <em>control.</em>', sub: 'Saved on your device. No account, no ads, no trackers.', img: r('privacy-signature.png') },
  { file: 'screenshot-5.png', title: 'See your <em>momentum.</em>', sub: 'Uses and estimated time saved, counted on your device.', img: r('analytics-light.png'), popup: r('popup-light.png') },
];

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
async function render(html, file, w, h) {
  const tmp = join(raw, `${file}.html`);
  writeFileSync(tmp, html);
  await pg.setViewportSize({ width: w, height: h });
  await pg.goto(pathToFileURL(tmp).href);
  await pg.evaluate(() => document.fonts.ready);
  await sleep(200);
  await pg.screenshot({ path: join(out, file) });
}
for (const fr of frames) await render(screenshotFrame(fr), fr.file, 1280, 800);

await render(
  `<html><head><style>${fonts}
  .logo{position:absolute;left:14px;top:20px;height:118px}
  h1{position:absolute;left:34px;top:142px;font-size:44px}
  p{position:absolute;left:36px;top:204px;margin:0;font-size:15px;font-weight:600;color:#ffd23f}
  .glow1{right:-520px;top:-560px}</style></head><body><div class="glow1"></div><div class="glow2"></div>
  <img class="logo" src="${logo}"><h1>Quick <em>Reply</em></h1><p>Reusable messages. Private by design.</p></body></html>`,
  'promo-small-440x280.png',
  440,
  280,
);

await render(
  `<html><head><style>${fonts}
  .logo{position:absolute;left:44px;top:46px;height:150px}
  h1{position:absolute;left:72px;top:210px;font-size:64px;width:560px}
  .sub{position:absolute;left:74px;top:300px;font-size:21px;width:540px;margin:0}
  .tag{position:absolute;left:74px;top:392px;font-weight:600;color:#ffd23f;font-size:17px;margin:0}
  .shotwrap{position:absolute;left:690px;top:60px;width:660px}</style></head><body><div class="glow1"></div><div class="glow2"></div>
  <img class="logo" src="${logo}">
  <h1>Kryz Quick <em>Reply</em></h1>
  <p class="sub">Save, personalize and insert the messages you send every day.</p>
  <p class="tag">Built for productivity. Designed for privacy.</p>
  <div class="shotwrap"><div class="shot"><img src="${r('templates-signature.png')}"></div></div></body></html>`,
  'promo-marquee-1400x560.png',
  1400,
  560,
);
await browser.close();
rmSync(raw, { recursive: true, force: true });
console.log(`Store assets written to ${out}`);
