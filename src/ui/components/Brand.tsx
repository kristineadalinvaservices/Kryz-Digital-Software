/**
 * Official logo integration.
 *
 * The official Kryz Digital Partners logo files go in /brand/logo (see brand/README.md):
 *   logo-full-light.(svg|png)   full logo for light backgrounds
 *   logo-full-dark.(svg|png)    full logo for dark backgrounds
 *   symbol-light.(svg|png)      brand symbol for light backgrounds (small sizes)
 *   symbol-dark.(svg|png)       brand symbol for dark backgrounds (small sizes)
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
  fullLight: find('logo-full-light'),
  fullDark: find('logo-full-dark'),
  symbolLight: find('symbol-light'),
  symbolDark: find('symbol-dark'),
};

export const OFFICIAL_LOGO_INSTALLED = Boolean(LOGO_ASSETS.fullLight && LOGO_ASSETS.fullDark && LOGO_ASSETS.symbolLight && LOGO_ASSETS.symbolDark);

/** Picks the light/dark variant with CSS so theme changes are instant. */
export function BrandLogo({ variant, height }: { variant: 'full' | 'symbol'; height: number }) {
  const light = variant === 'full' ? LOGO_ASSETS.fullLight : LOGO_ASSETS.symbolLight;
  const dark = variant === 'full' ? LOGO_ASSETS.fullDark : LOGO_ASSETS.symbolDark;
  if (!light && !dark) return null;
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
