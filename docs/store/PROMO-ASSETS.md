# Branded promotional asset specifications

All assets must use the **official** Kryz logo files (not yet supplied) and the brand tokens in BRAND.md. Produce in Canva using the existing "Kryz Template" set for consistency. Verify current Chrome Web Store image requirements at upload time.

| Asset | Size | Format | Content |
|---|---|---|---|
| Store icon | 128×128 (96×96 artwork + 16 px transparent padding) | PNG | Official brand symbol only; check legibility on light and dark |
| Screenshot 1 | 1280×800 | PNG/JPEG | Templates dashboard, Kryz Signature theme — headline "Write it once. Reply in *seconds.*" |
| Screenshot 2 | 1280×800 | PNG/JPEG | Personalization form + preview — "Personal, not generic." |
| Screenshot 3 | 1280×800 | PNG/JPEG | Shortcut `/followup` expanding in a plain text box (use a demo page, not a real person's inbox) — "Type /followup. Press Tab." |
| Screenshot 4 | 1280×800 | PNG/JPEG | Privacy & Security Center — "Your Data. *Your Control.*" |
| Screenshot 5 | 1280×800 | PNG/JPEG | Light theme + Analytics — "See your momentum." |
| Small promo tile | 440×280 | PNG/JPEG | Ink background, pink headline "Kryz Quick Reply", yellow "KRYZ DIGITAL PARTNERS" tag, symbol |
| Marquee (optional) | 1400×560 | PNG/JPEG | Hero layout from onboarding |

Rules: no fake reviews, ratings, user counts or client names; demo data only (e.g. "Ana", "Acme Co"); text ≥ 24 px at 1280 width; keep logo clear space per guidelines; no Chrome/Google trademarks beyond permitted wording. Base captures: `npm run test:e2e` writes reference screenshots to `tests/e2e/screenshots/` (demo data).
