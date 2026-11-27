// Renders a Kryz HTML graphic template to a still PNG or a transparent video.
//
//   node render_graphics.mjs <template> <out> [--w 1080] [--h 1920] [--fps 30] [--duration 4] [--still 1.5] [--p '{"title":"..."}']
//
// <template> is a name in templates/graphics (for example lower-third) or a path.
// out.png  -> one frame (at --still seconds, default: the end of the entrance)
// out.mov  -> ProRes 4444 with alpha, for DaVinci Resolve, Premiere and FFmpeg overlays
// out.webm -> VP9 with alpha, smaller, for browser previews
// Animation is frame accurate: every CSS animation is paused and set to the exact frame time.
// Works offline: fonts and logos load from local files only.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// require() so a global Playwright install is found too (npm i -g playwright, or npm i playwright here).
const { chromium } = createRequire(import.meta.url)('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const [tpl, out] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!tpl || !out) { process.stderr.write('usage: node render_graphics.mjs <template> <out.png|out.mov|out.webm> [options]\n'); process.exit(2); }

const tplPath = existsSync(tpl) ? resolve(tpl) : resolve(here, '../templates/graphics', tpl.endsWith('.html') ? tpl : `${tpl}.html`);
const W = Number(opt('w', 1080)), H = Number(opt('h', 1920)), fps = Number(opt('fps', 30));
const params = JSON.parse(opt('p', '{}'));
const dur = Number(opt('duration', params.duration ?? 4));
params.duration = dur;
const ext = extname(out).toLowerCase();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.addInitScript((p) => { window.KVS = p; }, params);
await page.goto(pathToFileURL(tplPath).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState('networkidle');

const seek = (t) => page.evaluate((ms) => {
  document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; });
}, t * 1000);

if (ext === '.png' || ext === '.jpg') {
  await seek(Number(opt('still', Math.min(1.2, dur / 2))));
  await page.screenshot({ path: out, omitBackground: true, type: ext === '.jpg' ? 'jpeg' : 'png' });
  process.stdout.write(`Wrote ${out}\n`);
} else {
  const dir = mkdtempSync(join(tmpdir(), 'kvs-'));
  const frames = Math.round(dur * fps);
  for (let f = 0; f < frames; f++) {
    await seek(f / fps);
    await page.screenshot({ path: join(dir, `f${String(f).padStart(5, '0')}.png`), omitBackground: true });
  }
  const codec = ext === '.webm'
    ? ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-auto-alt-ref', '0']
    : ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0'];
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', join(dir, 'f%05d.png'), ...codec, out], { stdio: 'inherit' });
  rmSync(dir, { recursive: true, force: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
  process.stdout.write(`Wrote ${out} (${frames} frames, ${W}x${H}, alpha)\n`);
}
await browser.close();
