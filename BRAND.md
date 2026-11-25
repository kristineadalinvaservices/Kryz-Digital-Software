# Brand implementation

Product: **Kryz Quick Reply** · Parent: **Kryz Digital Partners** · Ecosystem: **Kryz Digital Software**
Tagline: *Built for productivity. Designed for privacy.* · Commitment: *Your Data. Your Control.*

## Source of truth
**Kryz Brand Guidelines v2 (20 November 2026)**, supplied by the owner on 2026-11-25 with the official logo pack. Originals are kept unmodified in `brand/source/` (`Kryz-Brand-Guidelines.md`, `Kryz-Logo-SVG-Code.md`, all PNG/SVG/ICO files). v1 (pink and gold) is retired: no gold, blush or beige except the Dark Gold used inside the official light-background logo file.

Earlier provisional values from the Canva templates matched v2 for black, pink and yellow; the Brand Archetypes deck values (`#000000`, `#FF2D95`, `#FFE600`) are **not** used.

## Logo files in use (`brand/logo/`, bundled)
| Where | File | Why |
|---|---|---|
| Onboarding hero (always dark), About in Signature theme | `kryz-logo-3d-glow-for-dark.png` | Guideline main version on dark |
| About in Light theme | `kryz-logo-3d-for-light.png` | Guideline light-background version |
| Popup header, sidebar, empty states (Light) | `kryz-mark.svg` | Flat mark for small sizes |
| Popup header, sidebar, empty states (Signature) | `kryz-mark-3d.svg` | 3D mark for dark backgrounds |
| Extension icons 16/32/48 | from official `favicon.ico` (exact embedded sizes) | Official website icon |
| Extension icon 128 | official `kryz-website-icon-512.png` scaled down (Lanczos, no other change) | Official website icon |

The full-logo **SVG** files are not bundled: their text loads Manrope/Instrument Serif from Google Fonts, which the extension blocks (`connect-src 'none'`) and which would be a remote request. The guidelines direct PNG use where fonts can't load. Sizes respect the guideline minimums (mark ≥ 24 px tall, full logo ≥ 140 px wide).

## How the archetypes show up
- **Hero** — confident outcome headlines ("Reply faster. Stay *in control.*"), strong primary pink actions, visible progress (Analytics "momentum").
- **Sage** — calm plain-language explanations of every permission, a Privacy & Security Center that shows real status.
- **Outlaw** — the italic serif accent word breaking the sans headline, neon-on-ink Signature theme, myth-busting copy ("No tracking").

## Tokens (`src/ui/theme/tokens.css`)
Guidelines v2: Kryz Black `#141012`, Plum Surface `#1E181B`, Neon Pink `#FF3D9A`, Bright Yellow `#FFD23F`, Soft White `#F3E9EC`, Warm White `#FFF9F7`, Rose Gray `#BDAEB4`; signature gradient yellow to black to pink (special graphics only); soft pink glow; ~22 px card radius; pill buttons.
Derived for accessibility (Light theme UI text only, never logo): `--kz-pink-deep #B0115A` (pink text on Warm White, AA). Light theme uses Warm White surfaces so there are no pure white or pure black backgrounds.
Semantic tokens per theme: `--bg --surface --surface-2/3 --border --text --text-muted --accent --accent-bg --on-accent --highlight --focus --danger --success`, spacing `--sp-*`, radii `--r-*`, motion `--dur*`.

## Themes
- **Light**: blush-neutral page `#F6EFF1`, Warm White cards, Kryz Black text, Neon Pink primary buttons with black text, deep-pink links and accent words.
- **Kryz Signature**: Kryz Black base with pink/yellow glows, Plum Surface cards, Soft White text, Rose Gray body text, Neon Pink accents and active nav, Bright Yellow numbers and focus rings, pink glow on primary hover.
- **System**: follows the OS; dark → Kryz Signature. Switches live.
All text pairs pass WCAG 2.2 AA (`node scripts/contrast.mjs`).

## Typography (bundled locally, SIL OFL 1.1, notices in `dist/licenses/`)
Manrope ExtraBold for headlines and product name; Instrument Serif italic for one or two pink accent words; Inter for body and buttons. Latin subsets only, served from the extension (no Google Fonts requests).

## Voice in UI copy
Lead with the outcome, honest, no made up numbers, **no dashes** in user-facing copy, no emojis.

## Logo placement
`BrandLogo`/`BrandLockup` (`src/ui/components/Brand.tsx`) render the official files in: toolbar icon, popup header, dashboard sidebar, onboarding (privacy onboarding is the same screen), About, empty states. Future authentication screens must reuse these components. Store assets: docs/store/PROMO-ASSETS.md.
