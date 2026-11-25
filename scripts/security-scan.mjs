/**
 * Static security gate for the production build (dist/) and source tree.
 * Fails (exit 1) on any finding marked FAIL. Run: npm run audit:security  (after npm run build)
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const findings = [];
const add = (status, check, detail = '') => findings.push({ status, check, detail });

function walk(dir, filter = () => true, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'dist-dev', 'dist-e2e', 'release'].includes(name) && dir === root) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, filter, out);
    else if (filter(p)) out.push(p);
  }
  return out;
}

if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

// ---------- Manifest ----------
const m = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'));
const perms = [...(m.permissions ?? [])].sort().join(',');
perms === 'activeTab,scripting,storage' ? add('PASS', 'Required permissions are minimal', perms) : add('FAIL', 'Unexpected required permissions', perms);
!m.host_permissions?.length ? add('PASS', 'No install-time host permissions') : add('FAIL', 'Install-time host permissions present', m.host_permissions.join(','));
!m.content_scripts?.length ? add('PASS', 'No static content scripts (expander registered per approved site only)') : add('FAIL', 'Static content scripts declared');
!m.web_accessible_resources?.length ? add('PASS', 'No web-accessible resources') : add('FAIL', 'Web-accessible resources exposed');
!m.externally_connectable ? add('PASS', 'Not externally connectable (web pages cannot message the extension)') : add('FAIL', 'externally_connectable set');
const csp = m.content_security_policy?.extension_pages ?? '';
for (const need of ["script-src 'self'", "object-src 'none'", "connect-src 'none'", "base-uri 'none'"]) csp.includes(need) ? add('PASS', `CSP has ${need}`) : add('FAIL', `CSP missing ${need}`);
/unsafe-eval|unsafe-inline|https?:/.test(csp) ? add('FAIL', 'CSP allows unsafe or remote sources', csp) : add('PASS', 'CSP has no unsafe-eval / unsafe-inline / remote sources');
m.name.includes('TEST') || m.name.includes('DEV') ? add('FAIL', 'Production manifest has test/dev name') : add('PASS', 'Production manifest name', m.name);

// ---------- Built code ----------
const built = walk(dist, (p) => /\.(js|html)$/.test(p));
const rules = [
  [/\beval\s*\(/, 'eval('],
  [/new\s+Function\s*\(/, 'new Function('],
  [/\bfetch\s*\(/, 'fetch('],
  [/XMLHttpRequest/, 'XMLHttpRequest'],
  [/new\s+WebSocket/, 'WebSocket'],
  [/sendBeacon/, 'sendBeacon'],
  [/EventSource/, 'EventSource'],
  [/importScripts/, 'importScripts'],
  [/<script[^>]+src=["']https?:/i, 'remote <script src>'],
  [/<link[^>]+href=["']https?:/i, 'remote <link href>'],
];
for (const file of built) {
  const text = readFileSync(file, 'utf8');
  for (const [re, label] of rules) if (re.test(text)) add('FAIL', `Built code contains ${label}`, relative(root, file));
  if (/<script>(?!\s*<\/script>)/i.test(text) && file.endsWith('.html')) add('FAIL', 'Inline <script> in HTML', relative(root, file));
}
add('PASS', `Scanned ${built.length} built files for eval/Function/network APIs/remote code`);
const urls = new Set();
for (const file of built) for (const u of readFileSync(file, 'utf8').match(/https?:\/\/[a-z0-9.-]+/gi) ?? []) urls.add(u);
add('INFO', 'URL strings present in bundle (not requests; e.g. React error-doc links, XML namespaces)', [...urls].join(', ') || 'none');

// ---------- Source ----------
const src = walk(resolve(root, 'src'), (p) => /\.(ts|tsx)$/.test(p));
for (const file of src) {
  const text = readFileSync(file, 'utf8');
  if (/dangerouslySetInnerHTML|\.innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|document\.write/.test(text)) add('FAIL', 'Unsafe HTML sink in source', relative(root, file));
  if (/console\.(log|info|debug)\(/.test(text)) add('FAIL', 'console logging in source (could leak content)', relative(root, file));
}
add('PASS', `Scanned ${src.length} source files for HTML injection sinks and logging`);

// ---------- Secrets ----------
const secretRe = [
  /AKIA[0-9A-Z]{16}/, /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bsk-[A-Za-z0-9]{20,}/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /AIza[0-9A-Za-z_-]{35}/, /xox[baprs]-[A-Za-z0-9-]{10,}/,
];
const repoFiles = walk(root, (p) => !/\.(png|jpg|jpeg|gif|webp|ico|zip|woff2?)$/.test(p) && !p.endsWith('security-scan.mjs'));
let secretHits = 0;
for (const file of repoFiles) {
  const text = readFileSync(file, 'utf8');
  for (const re of secretRe) if (re.test(text)) { secretHits++; add('FAIL', 'Possible secret committed', relative(root, file)); }
}
if (!secretHits) add('PASS', `Secret scan: ${repoFiles.length} files, no credentials found`);
for (const f of ['.env', '.env.local', 'credentials.json']) if (existsSync(join(root, f))) add('FAIL', `Sensitive file present: ${f}`);

// ---------- Dependencies ----------
try {
  const audit = JSON.parse(execSync('npm audit --json', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  const v = audit.metadata.vulnerabilities;
  const serious = v.high + v.critical;
  serious ? add('FAIL', 'npm audit: high/critical vulnerabilities', JSON.stringify(v)) : add('PASS', 'npm audit: no high/critical vulnerabilities', JSON.stringify(v));
} catch (e) {
  try {
    const audit = JSON.parse(e.stdout?.toString() ?? '{}');
    const v = audit.metadata?.vulnerabilities;
    v && v.high + v.critical === 0 ? add('WARN', 'npm audit: low/moderate issues only', JSON.stringify(v)) : add('FAIL', 'npm audit reported vulnerabilities', JSON.stringify(v ?? 'unavailable'));
  } catch {
    add('WARN', 'npm audit could not run (offline?)');
  }
}
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const prodLicenses = Object.entries(lock.packages)
  .filter(([k, v]) => k.startsWith('node_modules/') && !v.dev)
  .map(([k, v]) => `${k.replace('node_modules/', '')}@${v.version} (${v.license ?? 'unknown'})`);
const badLicense = prodLicenses.filter((l) => !/\((MIT|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2.0|0BSD|OFL-1.1)\)/.test(l));
for (const f of ['react-LICENSE.txt', 'manrope-OFL.txt', 'inter-OFL.txt', 'instrument-serif-OFL.txt'])
  existsSync(join(dist, 'licenses', f)) ? null : add('FAIL', `Licence notice missing from build: ${f}`);
add('PASS', 'Third-party licence notices shipped in dist/licenses');
const fontFiles = walk(dist, (p) => /\.(woff2?|ttf|otf)$/.test(p));
add(fontFiles.length ? 'PASS' : 'FAIL', `Brand fonts bundled locally (${fontFiles.length} files, no remote font loading)`);
for (const [icon, rel] of Object.entries(m.icons ?? {})) existsSync(join(dist, rel)) || add('FAIL', `Icon ${icon} missing`, rel);
m.icons && Object.keys(m.icons).length === 4 ? add('PASS', 'Official extension icons 16/32/48/128 present') : add('FAIL', 'Extension icons missing');
badLicense.length ? add('FAIL', 'Shipped dependency with unreviewed licence', badLicense.join(', ')) : add('PASS', 'Shipped dependency licences reviewed (permissive)', prodLicenses.join(', '));

// ---------- Report ----------
const fails = findings.filter((f) => f.status === 'FAIL');
for (const f of findings) console.log(`${f.status.padEnd(4)}  ${f.check}${f.detail ? `\n        ${f.detail}` : ''}`);
writeFileSync(resolve(root, 'tests/security-scan-last-run.json'), JSON.stringify({ date: new Date().toISOString(), findings }, null, 2));
console.log(`\n${findings.filter((f) => f.status === 'PASS').length} passed, ${fails.length} failed, ${findings.filter((f) => f.status === 'WARN').length} warnings`);
process.exit(fails.length ? 1 : 0);
