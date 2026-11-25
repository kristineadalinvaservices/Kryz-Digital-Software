# Branded promotional asset specifications

All assets must use the official Kryz logo files in `brand/source/` and the rules in Brand Guidelines v2 (fonts: Manrope ExtraBold, Instrument Serif italic accents in pink, Inter; ~70% black, 20% text, 10% pink and yellow; no emojis; no dashes in copy). Produce in Canva using the existing "Kryz Template" set for consistency. Verify current Chrome Web Store image requirements at upload time.

| Asset | Size | Format | Content |
|---|---|---|---|
| Store icon | 128×128 | PNG | Use `brand/icons/icon-128.png` (official website icon). The official 350×180 app icon does not match a Chrome Web Store size; use it for the download page instead |
| Screenshot 1 | 1280×800 | PNG/JPEG | Templates dashboard, Kryz Signature theme; headline "Write it once. Reply in *seconds.*" |
| Screenshot 2 | 1280×800 | PNG/JPEG | Personalization form + preview; headline "Personal, not generic." |
| Screenshot 3 | 1280×800 | PNG/JPEG | Shortcut `/followup` expanding in a plain text box (use a demo page, not a real person's inbox); headline "Type /followup. Press Tab." |
| Screenshot 4 | 1280×800 | PNG/JPEG | Privacy & Security Center; headline "Your Data. *Your Control.*" |
| Screenshot 5 | 1280×800 | PNG/JPEG | Light theme + Analytics; headline "See your momentum." |
| Small promo tile | 440×280 | PNG/JPEG | Ink background, pink headline "Kryz Quick Reply", yellow "KRYZ DIGITAL PARTNERS" tag, symbol |
| Marquee (optional) | 1400×560 | PNG/JPEG | Hero layout from onboarding |

Rules: no fake reviews, ratings, user counts or client names; demo data only (e.g. "Ana", "Acme Co"); text ≥ 24 px at 1280 width; keep logo clear space per guidelines; no Chrome/Google trademarks beyond permitted wording. Base captures: `npm run test:e2e` writes reference screenshots to `tests/e2e/screenshots/` (demo data).
