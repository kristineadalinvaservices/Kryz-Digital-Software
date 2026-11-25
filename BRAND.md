# Brand implementation

Product: **Kryz Quick Reply** · Parent: **Kryz Digital Partners** · Ecosystem: **Kryz Digital Software**
Tagline: *Built for productivity. Designed for privacy.* · Commitment: *Your Data. Your Control.*

## Sources used (2026-11-25)
The official brand guidelines and logo were **not supplied**. Discovery checked the empty project directory, Google Drive and Canva.
- **Canva "Kryz Template" set** (LinkedIn Post, Instagram Post/Story, LinkedIn Banner, Facebook Cover): ink `#141012`, pink `#FF3D9A`, yellow `#FFD23F`, blush text `#F3E9EC`; bold sans headlines with tight tracking (−0.04em) and an *italic serif accent word*; a yellow tag with ink caps reading "KRYZ DIGITAL PARTNERS"; placeholder text "Kryz logo here".
- **Canva "Kristine's BRAND ARCHETYPES"**: Hero (primary), Sage (secondary), Outlaw (accent). Visual language "black base with neon pink and yellow"; lists `#000000`, `#FF2D95`, `#FFE600`.

**Conflict to resolve:** the two sources give slightly different hex values. The build uses the Kryz Template values (newer, Kryz-specific). Confirm which set is official.

## How the archetypes show up
- **Hero** — confident outcome headlines ("Reply faster. Stay *in control.*"), strong primary pink actions, visible progress (Analytics "momentum").
- **Sage** — calm plain-language explanations of every permission, a Privacy & Security Center that shows real status.
- **Outlaw** — the italic serif accent word breaking the sans headline, neon-on-ink Signature theme, myth-busting copy ("No tracking").

## Tokens (`src/ui/theme/tokens.css`)
Raw: `--kz-ink #141012`, `--kz-pink #FF3D9A`, `--kz-yellow #FFD23F`, `--kz-blush #F3E9EC`, `--kz-gradient pink→yellow`.
Derived for accessibility (UI text only, never logo): `--kz-pink-deep #B0115A` (pink text on white, 6.8:1).
Semantic tokens per theme: `--bg --surface --surface-2/3 --border --text --text-muted --accent --accent-bg --on-accent --highlight --focus --danger --success`, spacing `--sp-*`, radii `--r-*`, motion `--dur*`.

## Themes
- **Light** — warm off-white `#FAF7F8`, white cards, ink text, pink primary buttons with ink text, deep-pink links.
- **Kryz Signature** — ink `#141012` base with pink/yellow radial glows, ink cards, blush text, neon pink accents, yellow focus rings, pink active nav, gradient bars. Not an inversion of Light.
- **System** — follows the OS; dark → Kryz Signature. Switches live.
All text pairs pass WCAG 2.2 AA (`node scripts/contrast.mjs`).

## Typography
Official typeface unknown → `system-ui` stack, no bundled fonts (no licensing risk). Accent words use `ui-serif/Georgia` italic. Replace `--font-sans`/`--font-accent` when the licensed brand fonts are supplied (bundle locally, check licence).

## Logo
See `brand/README.md`. `BrandLogo`/`BrandLockup` render the official files in: popup header, dashboard sidebar, onboarding/privacy onboarding, About, empty states; icons generated at build. If missing, **no mark is shown** — only the product name as text. Store promotional assets: docs/store/PROMO-ASSETS.md.
