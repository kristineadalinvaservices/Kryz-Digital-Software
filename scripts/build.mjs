/**
 * Builds the extension.
 *   --mode=production   dist/       minified, no source maps (store package)
 *   --mode=development  dist-dev/   source maps, readable code
 *   --mode=e2e          dist-e2e/   like development + localhost host permission for automated tests ONLY
 */
import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = (process.argv.find((a) => a.startsWith('--mode=')) ?? '--mode=production').split('=')[1];
const outDir = resolve(root, mode === 'production' ? 'dist' : mode === 'e2e' ? 'dist-e2e' : 'dist-dev');
const prod = mode === 'production';
// e2e uses production bundling (minified) so tests exercise the same code that ships; only the manifest differs.
const minified = mode !== 'development';
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

process.env.KQR_OUT_DIR = outDir;
await viteBuild({ configFile: resolve(root, 'vite.config.ts'), mode: minified ? 'production' : 'development', logLevel: 'warn' });

for (const [entry, out] of [
  ['src/background/index.ts', 'background.js'],
  ['src/content/index.ts', 'content.js'],
]) {
  await esbuild({
    entryPoints: [resolve(root, entry)],
    outfile: resolve(outDir, out),
    bundle: true,
    format: 'iife',
    target: 'chrome116',
    minify: minified,
    sourcemap: minified ? false : 'inline',
    legalComments: 'none',
    logLevel: 'warning',
  });
}

// ---------- Icons: official icon files (brand/icons), copied unmodified ----------
const iconDir = resolve(root, 'brand/icons');
let icons = null;
if (existsSync(iconDir) && [16, 32, 48, 128].every((n) => existsSync(resolve(iconDir, `icon-${n}.png`)))) {
  mkdirSync(resolve(outDir, 'icons'), { recursive: true });
  icons = {};
  for (const n of [16, 32, 48, 128]) {
    copyFileSync(resolve(iconDir, `icon-${n}.png`), resolve(outDir, `icons/icon-${n}.png`));
    icons[String(n)] = `icons/icon-${n}.png`;
  }
} else {
  console.warn('\n⚠  Official icons not found (brand/icons/icon-16|32|48|128.png). Built WITHOUT extension icons.\n');
}

// ---------- Third-party licence notices (MIT/OFL require the notice to travel with the code/fonts) ----------
mkdirSync(resolve(outDir, 'licenses'), { recursive: true });
for (const [pkgName, file] of [
  ['react', 'react-LICENSE.txt'],
  ['react-dom', 'react-dom-LICENSE.txt'],
  ['scheduler', 'scheduler-LICENSE.txt'],
  ['@fontsource/manrope', 'manrope-OFL.txt'],
  ['@fontsource/inter', 'inter-OFL.txt'],
  ['@fontsource/instrument-serif', 'instrument-serif-OFL.txt'],
]) {
  copyFileSync(resolve(root, 'node_modules', pkgName, 'LICENSE'), resolve(outDir, 'licenses', file));
}

// ---------- Manifest ----------
const manifest = {
  manifest_version: 3,
  name: 'Kryz Quick Reply',
  short_name: 'Quick Reply',
  version: pkg.version,
  description: 'Save, personalize and insert reusable messages and text shortcuts. Local-first and private. By Kryz Digital Partners.',
  minimum_chrome_version: '116',
  action: { default_popup: 'popup.html', default_title: 'Kryz Quick Reply' },
  background: { service_worker: 'background.js' },
  permissions: ['storage', 'activeTab', 'scripting'],
  optional_host_permissions: ['https://*/*', 'http://*/*'],
  commands: {
    _execute_action: { suggested_key: { default: 'Alt+Shift+K' }, description: 'Open Kryz Quick Reply' },
  },
  content_security_policy: {
    extension_pages:
      "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; connect-src 'none'; img-src 'self' data: blob:; style-src 'self'; font-src 'self'",
  },
};
if (icons) {
  manifest.icons = icons;
  manifest.action.default_icon = icons;
}
if (mode === 'e2e') {
  // Test-only: pre-granted access to the local test server so automation can avoid permission prompts.
  manifest.host_permissions = ['http://localhost/*', 'http://127.0.0.1/*'];
  manifest.name += ' (E2E TEST BUILD)';
}
if (mode === 'development') manifest.name += ' (DEV)';
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Built ${mode} → ${outDir}`);
