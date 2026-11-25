/**
 * Official logo integration.
 *
 * Official Kryz Digital Partners files (Brand Guidelines v2, 20 Nov 2026), unmodified, in /brand/logo:
 *   kryz-logo-3d-for-light.png       full logo, light backgrounds
 *   kryz-logo-3d-glow-for-dark.png   full logo, dark backgrounds (main version)
 *   kryz-mark.svg                    flat K mark, small sizes / light backgrounds
 *   kryz-mark-3d.svg                 3D K mark, dark backgrounds
 * PNGs are used for the full logo because the SVG versions load fonts from the internet,
 * which the extension blocks (guidelines: "Where fonts can't load, use the PNG files").
 *
 * They are bundled at build time. If a file is missing we show NO mark at all — we never
 * draw, regenerate or substitute a logo. The product name is still shown as plain text.
 */
import { PRODUCT } from '../../shared/constants';

const files = import.meta.glob('../../../brand/logo/*.{svg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function find(stem: string): string | null {
  for (const [path, url] of Object.entries(files)) {
    const name = path.split('/').pop() ?? '';
    if (name.replace(/\.(svg|png|webp)$/, '') === stem) return url;
  }
  return null;
}

export const LOGO_ASSETS = {
  fullLight: find('kryz-logo-3d-for-light'),
  fullDark: find('kryz-logo-3d-glow-for-dark'),
  symbolLight: find('kryz-mark'),
  symbolDark: find('kryz-mark-3d'),
};

export const OFFICIAL_LOGO_INSTALLED = Boolean(LOGO_ASSETS.fullLight && LOGO_ASSETS.fullDark && LOGO_ASSETS.symbolLight && LOGO_ASSETS.symbolDark);

/**
 * `on` = the background the logo sits on. "auto" follows the theme; "dark" forces the dark-background
 * file (e.g. the always-dark onboarding hero). Guideline minimums: mark 24 px tall, full logo 140 px wide.
 */
export function BrandLogo({ variant, height, on = 'auto' }: { variant: 'full' | 'symbol'; height: number; on?: 'auto' | 'dark' | 'light' }) {
  let light = variant === 'full' ? LOGO_ASSETS.fullLight : LOGO_ASSETS.symbolLight;
  let dark = variant === 'full' ? LOGO_ASSETS.fullDark : LOGO_ASSETS.symbolDark;
  if (on === 'dark') light = null;
  if (on === 'light') dark = null;
  if (!light && !dark) return null;
  if (on !== 'auto') {
    const src = (light ?? dark)!;
    return (
      <span className="brand-logo brand-mark" style={{ height, display: 'inline-block' }}>
        <img src={src} alt={variant === 'full' ? PRODUCT.parentBrand : ''} height={height} style={{ display: 'block' }} />
      </span>
    );
  }
  return (
    <span className="brand-logo brand-mark" style={{ height, display: 'inline-block' }}>
      {light && <img className="logo-on-light" src={light} alt={variant === 'full' ? PRODUCT.parentBrand : ''} height={height} />}
      {dark && <img className="logo-on-dark" src={dark} alt={variant === 'full' ? PRODUCT.parentBrand : ''} height={height} />}
    </span>
  );
}

/** Product lockup: symbol (when installed) + product name + subtle parent-brand attribution. */
export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup">
      <BrandLogo variant="symbol" height={compact ? 28 : 34} />
      <div className="names">
        <span className="product">{PRODUCT.name}</span>
        <span className="parent">by {PRODUCT.parentBrand}</span>
      </div>
    </div>
  );
}

/** Parent-brand attribution label, taken from the Kryz template set (yellow tag, ink caps). */
export function ParentBadge() {
  return <span className="parent-badge">{PRODUCT.parentBrand}</span>;
}
