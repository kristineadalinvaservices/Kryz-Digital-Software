# Doc 2: Universal Video Editing and Motion Graphics Brand Guide

Version 0.1 for approval, 27 November 2026. Source of truth for brand values: **Kryz Brand Guidelines v2 (20 November 2026)** in `brand/source/`. Where this guide goes beyond the guidelines, the item is marked **Proposed**.

The goal: someone recognises a Kryz video before they see the logo. Four things do that work, every time:

1. **Ink black frames with a neon pink glow** (70 percent black, 20 percent text, 10 percent pink and yellow).
2. **Manrope ExtraBold headlines with one Instrument Serif italic accent word in pink.**
3. **Bright Yellow for emphasis**: highlighted caption keywords, underline sweeps, callout boxes, numbers.
4. **The yellow underline sweep** under every title (Proposed signature move).

## 1. Colour

| Token | Hex | Video use |
|---|---|---|
| Kryz Black | #141012 | Backgrounds, caption outline, text boxes. Never pure black. |
| Plum Surface | #1E181B | Cards, panels, lower third box |
| Neon Pink | #FF3D9A | Accent words, CTA buttons, glow, lower third bar |
| Bright Yellow | #FFD23F | Caption keyword highlight (approved yellow highlight retained), callouts, numbers, underline |
| Soft White | #F3E9EC | Caption text, body text on dark |
| Warm White | #FFF9F7 | Headline text on dark |
| Rose Gray | #BDAEB4 | Secondary text, end screen guides |

Signature gradient (yellow, black, pink) only for covers, thumbnails and photo backgrounds. No gold, blush or beige (retired v1 palette). No emojis in any design.

## 2. Typography

| Role | Font | Rule |
|---|---|---|
| Titles, hooks, captions | Manrope ExtraBold | Sentence case. Tight leading (1.0 to 1.05). |
| Accent word | Instrument Serif Italic, pink | One or two words per title, never a whole line. 1.1x the headline size. |
| Labels, buttons, lower third role | Inter SemiBold | Kickers in uppercase with 0.12em spacing. |
| Body (long form graphics, charts) | Inter Regular | |

Markup used by all templates: `[word]` becomes the pink serif accent, `*word*` becomes yellow.

**Sizes at 1080 wide (vertical):** hook title 104 to 118 px; captions 78 px; lower third name 54 px, role 30 px; CTA button 46 px. At 1920 wide (horizontal) multiply by about 0.8 relative to frame width.

**Max words on screen:** captions 4; hook titles 7; thumbnails 5; Reel cover 8.

**Copy rules (from the guidelines):** lead with the outcome, no made up numbers, **no dashes of any kind** in on screen text (captions convert spoken dashes to commas automatically), no public rates.

## 3. Logo

- Use only the official files, unmodified. Never redraw, recolour, stretch or regenerate.
- Watermark: 3D K mark, top right inside the platform safe zone, 72 px tall, 85 percent opacity (Proposed). Minimum 24 px tall.
- Full logo (glow version on dark) only in logo reveal, end screens and covers; minimum 140 px wide; clear space of one arrow head on every side.
- Never on busy photos without a dark shade behind it.

## 4. Captions (subtitles)

- Manrope ExtraBold, Soft White, 6 px Kryz Black outline, no box.
- Up to 4 words per screen, breaking at punctuation and natural pauses.
- Keywords in Bright Yellow. Two modes: **Keyword** (default, calm, for storytelling and thought leadership) and **Karaoke** (each word turns yellow as it is spoken, for fast educational Reels).
- 90 ms pop in on each new line. No bouncing, no per letter animation.
- Vertical: centred at about 62 percent of the height, clear of faces and the platform buttons. Horizontal: lower area at 84 percent.
- Mixed English, Tagalog and Bisaya kept as spoken. Spelling corrected, meaning never changed.
- Always also export an SRT for platform upload (accessibility and sound off viewing).

## 5. Graphic components (all in `templates/graphics/`)

| Component | Look | When |
|---|---|---|
| Hook title | Optional yellow kicker, headline with pink accent word, yellow underline sweep | First 0 to 3 s of most videos |
| Lower third | Pink glowing bar, dark rounded box, Warm White name, yellow role | First on camera appearance, guests, testimonials |
| Callout box | Yellow rounded box that draws itself, the rest of the screen dims 45 percent, yellow pill label | Screen recordings: the button or field being discussed |
| Demo label | Yellow pill "Demo", top left, for the whole demo | Required on every product or system demonstration (Content Calendar rule) |
| CTA | Short lead line, pink pill button with slow glow pulse | Last 3 to 5 s, or mid roll for long form |
| Logo reveal | Official logo pops in over a pink halo, tagline in serif italic | Long form intro (max 2.5 s), never on short form |
| End screen | Logo, two empty slots for YouTube elements, CTA | Last 20 s of long form |
| Reel cover | Gradient or photo with shade, pink series pill, title in the centre 1080x1440 band, yellow bar | Every Reel, TikTok and Short |
| Thumbnail | Text left (max 5 words, one yellow keyword), face right, K mark top left | Every long form video |

## 6. Motion rules

- Entrances: 0.35 to 0.5 s, ease out (cubic bezier .16, 1, .3, 1). Exits: 0.35 s, ease in.
- Maximum one animated graphic on screen at once, plus captions.
- Glow pulses only on CTAs.
- No spinning, glitch, light leaks, whooshing 3D text or stock transitions. They make the brand look cheap.

## 7. Light mode

Default is dark (Kryz Signature). Light mode only when the content is filmed in a bright setting and dark graphics would clash: Warm White surfaces, Kryz Black text, pink accent words in Deep Pink #B0115A for contrast, light background logo file. (Proposed.)

## 8. Platform controlled variations

Same design system everywhere. Only these change per platform: size, caption position, safe zone margins, pace and CTA wording (see Doc 4 and Doc 6).

## 9. Not yet included (needs your input)

- **Krafted Academy guidelines**: I searched your Drive and did not find them. I found the ACCLA System (ICE Matrix) and the DigiPro offer ladder. Please share the Krafted Academy file or tell me which of these you meant.
- **Buyer psychology research** and **ideal customer profile**: not found as separate files. I used the ideal client section of the Business Playbook (26 Nov 2026) for now.
- **Music**: no licensed library chosen yet. See Doc 5, section 6.

## Log
- 2026-11-27: v0.1 drafted from Brand Guidelines v2, BRAND.md and the Business Playbook. Templates built and render tested.
