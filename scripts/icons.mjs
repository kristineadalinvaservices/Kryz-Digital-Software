/** Renders the official brand symbol to 16/32/48/128 PNG icons, preserving aspect ratio and adding no artwork. */
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

export async function renderIcons(symbolPath, outDir) {
  const { createRequire } = await import('node:module');
  const { chromium } = createRequire(import.meta.url)('playwright');
  mkdirSync(outDir, { recursive: true });
  const mime = extname(symbolPath) === '.svg' ? 'image/svg+xml' : 'image/png';
  const dataUrl = `data:${mime};base64,${readFileSync(symbolPath).toString('base64')}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = {};
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent"><img src="${dataUrl}" style="width:${size}px;height:${size}px;object-fit:contain;display:block"></body></html>`);
    await page.waitForLoadState('load');
    const file = resolve(outDir, `icon-${size}.png`);
    await page.screenshot({ path: file, omitBackground: true });
    out[String(size)] = `icons/icon-${size}.png`;
  }
  await browser.close();
  return out;
}
