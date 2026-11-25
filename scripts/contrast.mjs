/** WCAG 2.2 contrast check for the theme token pairs used for text and controls. */
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const PAIRS = [
  // [theme, foreground, background, use, minimum]  (colours from Brand Guidelines v2 + derived UI values)
  ['light', '#141012', '#f6eff1', 'body text on page', 4.5], ['light', '#141012', '#fff9f7', 'body text on card', 4.5],
  ['light', '#5b4f55', '#fff9f7', 'muted text', 4.5], ['light', '#5b4f55', '#f6eff1', 'muted text on page', 4.5],
  ['light', '#b0115a', '#fff9f7', 'accent links', 4.5], ['light', '#b0115a', '#f6eff1', 'accent words on page', 4.5],
  ['light', '#141012', '#ff3d9a', 'primary button', 4.5], ['light', '#141012', '#ffd23f', 'parent badge', 4.5],
  ['light', '#fff9f7', '#141012', 'active nav item', 4.5], ['light', '#b42318', '#fff9f7', 'danger text', 4.5],
  ['light', '#146c37', '#e8f5ee', 'success badge', 4.5], ['light', '#8f0d49', '#fbe5ef', 'variable token', 4.5],
  ['light', '#b0115a', '#fff9f7', 'focus ring (non-text)', 3],
  ['signature', '#f3e9ec', '#141012', 'body text', 4.5], ['signature', '#f3e9ec', '#1e181b', 'body text on card', 4.5],
  ['signature', '#bdaeb4', '#1e181b', 'muted text (Rose Gray)', 4.5], ['signature', '#bdaeb4', '#141012', 'muted text on page', 4.5],
  ['signature', '#ff3d9a', '#141012', 'accent text', 4.5], ['signature', '#ff3d9a', '#1e181b', 'accent on card', 4.5],
  ['signature', '#141012', '#ff3d9a', 'primary button / active nav', 4.5], ['signature', '#ffd23f', '#141012', 'highlight / focus', 4.5],
  ['signature', '#ffd23f', '#1e181b', 'stat numbers', 4.5], ['signature', '#ff9b91', '#1e181b', 'danger text', 4.5],
  ['signature', '#86e3ad', '#173226', 'success badge', 4.5], ['signature', '#ff9cca', '#3a1f2d', 'variable token', 4.5],
  ['hero', '#fff9f7', '#141012', 'onboarding headline', 4.5], ['hero', '#bdaeb4', '#141012', 'onboarding body', 4.5],
];
let fail = 0;
for (const [t, fg, bg, use, min] of PAIRS) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${t.padEnd(9)} ${use.padEnd(22)} ${fg} on ${bg}  ${r.toFixed(2)}:1 (min ${min})`);
}
if (fail) { console.error(`${fail} contrast failures`); process.exitCode = 1; }
