# Doc 9: Reusable Video Editing Templates

Version 0.1, 27 November 2026. Everything listed here exists in `video-system/` and was render tested on 27 November 2026 with a synthetic test clip (`scripts/selftest.sh`, all checks passed). It has **not** been used on real footage yet.

Previews: `docs/previews/vertical-templates.jpg` and `docs/previews/horizontal-templates.jpg`.

## Motion graphics (`templates/graphics/`)

| Template | Output | Fields | Notes |
|---|---|---|---|
| `title-card` | Transparent .mov or PNG | kicker, title, valign, size, pad | `[word]` pink serif accent, `*word*` yellow |
| `lower-third` | .mov | name, role, x, y | Default y keeps it above the Reels UI; use y 120px for 16:9 |
| `cta` | .mov | lead, button, y | Default button: "Message SYSTEM for a walkthrough" (approved CTA from the Content Calendar) |
| `callout` | .mov | x, y, w, h, label, dim | Rectangle in output pixels |
| `demo-label` | .mov | text, x, y | Required on demos with fictional data |
| `logo-reveal` | .mov | logo, tagline | Official logo file only |
| `end-screen` | .mov or PNG | cta | Two empty slots for YouTube elements |
| `reel-cover` | PNG 1080x1920 | series, title, photo | Text inside the grid safe band |
| `thumbnail` | PNG 1280x720 | title, badge, photo | Max 5 words |

Render any of them:
```bash
node scripts/render_graphics.mjs <template> <out.mov|out.webm|out.png> --w 1080 --h 1920 --duration 3 --p '{"title":"..."}'
```
.mov is ProRes 4444 with transparency: drag it onto a track above the footage in DaVinci Resolve, Premiere or CapCut desktop. Shared styles live in `kryz.css`, so a brand change is made once.

## Scripts (`scripts/`)

| Script | Does |
|---|---|
| `pipeline.py` | Raw clip to all platform versions in one command |
| `cut_silence.py` | Dead air removal with a reviewable edit list |
| `normalize_audio.py` | Voice clean up and -14 LUFS loudness |
| `reframe.py` | 9:16, 4:5, 1:1, 16:9; crop, face crop or blurred fill |
| `transcribe.py` | Timestamped transcript, SRT, word timings |
| `captions.py` | Branded captions (keyword or karaoke), burn in |
| `brand_overlay.py` | Logo watermark and timed graphics |
| `render_graphics.mjs` | Renders the HTML templates |
| `analyze_reference.py` | Evidence pack for reference videos (Doc 1) |
| `prepare_fonts.py` | Brand fonts for FFmpeg |
| `selftest.sh` | Proves the whole chain works |

## Presets

- `brand/tokens.json`: colours, fonts, caption style, logo rules.
- `presets/platforms.json`: sizes, frame rates, safe zones, loudness per platform (verify before first export).
- `templates/tracker/content-tracker-columns.csv`: tracker columns with one example row.

## Still to build (after your approval of Doc 2)

Before and after split template, chart template, automatic punch ins, music bed with ducking, a DaVinci Resolve project template with the graphics preloaded (needs Resolve on your computer), Canva versions of the cover and thumbnail (via the Canva connector, if you want them editable there).

## Log
- 2026-11-27: v0.1. All templates rendered and visually checked; pipeline self test passed.
