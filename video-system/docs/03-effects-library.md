# Doc 3: Video Effects and Animation Library

Version 0.1, 27 November 2026. Every effect has a name, a purpose, settings and how it is made. "Built" means a working template or script exists in this folder and was render tested. "Manual" means it is done by hand in DaVinci Resolve (free) or CapCut, with the settings given.

None of these entries come from the reference videos yet (Doc 1 is blocked). They will be tagged with reference timestamps once those are analysed.

## A. Cuts and pacing

| Effect | Purpose | How | Settings | Status |
|---|---|---|---|---|
| Dead air cut | Removes pauses so ideas land faster | `cut_silence.py` | noise -35 dB, min silence 0.6 s, pad 0.12 s | Built |
| Kept pause | Lets an emotional or punchline beat breathe | `cut_silence.py --keep-pause 1.2` keeps long pauses at 0.45 s | | Built |
| Jump cut | Removes false starts and repeats within one shot | Edit list review, then Resolve | Cut on a breath, never mid word | Manual |
| Punch in | Emphasis on a key sentence, hides a jump cut | Resolve: Zoom 1.15 to 1.25 on the cut, no animation | Alternate 1.0 and 1.2 on consecutive cuts | Manual (automation planned) |
| Smooth push in | Builds tension over a statement | Resolve: Zoom 1.0 to 1.08 over 2 to 4 s, ease in out | | Manual |
| Speed ramp | Energy through B roll or workflow sequences | Resolve: Retime curve 100 percent to 300 percent and back, Optical Flow | Only on B roll, never on speech | Manual |
| Freeze frame | Pause on a moment to annotate it | Resolve: Freeze Frame, then a callout box over it | 1 to 2 s | Manual |

## B. Screen recordings and demos

| Effect | Purpose | How | Settings | Status |
|---|---|---|---|---|
| Fit with blurred fill | Keeps the whole interface visible in 9:16 | `reframe.py --mode fill` | blur 40, darken 0.18 | Built |
| Screen zoom to area | Shows the exact button or field | Resolve: Zoom and Position keyframes, 0.4 s ease out, hold, 0.4 s back | Max 2.0x on 1080p sources; record at 1440p or 4K for deeper zooms | Manual |
| Callout box with dim | Points the eye to one element | `callout` template | box x, y, w, h in output pixels; dim 0.45 | Built |
| Cursor highlight | Makes the mouse easy to follow | Record with the cursor highlight setting on (macOS: Accessibility, Pointer; or the recorder's highlight option) | Yellow ring if offered | Capture setting |
| Demo label | Honesty: marks demos with fictional data | `demo-label` template, whole demo | | Built |
| Before and after split | Shows the transformation | Resolve: two clips, crop each to half, 8 px Kryz Black divider, "Before" and "After" Inter SemiBold labels | | Manual (template planned) |

## C. Text and graphics

| Effect | Purpose | How | Status |
|---|---|---|---|
| Hook title with underline sweep | Instant topic and brand signal | `title-card` | Built |
| Caption keyword highlight | Retention and skim reading | `captions.py --keywords` | Built |
| Karaoke captions | Pace for educational Reels | `captions.py --style karaoke` | Built |
| Lower third | Name and authority | `lower-third` | Built |
| CTA button pulse | Clear next action | `cta` | Built |
| Text pop up (key point) | Reinforces a list item | `title-card` with `valign:flex-end` and a smaller size | Built (reuse) |
| Logo reveal | Long form opener | `logo-reveal` (official file, opacity and scale only) | Built |
| End screen | YouTube retention | `end-screen` | Built |
| Charts and numbers | Data stories | Proposed: HTML template with bars that grow; only real numbers | Planned |

## D. Picture

| Effect | Purpose | How | Status |
|---|---|---|---|
| Face centred vertical crop | Talking head to 9:16 | `reframe.py --face` (OpenCV, steady median position) | Built (needs OpenCV installed) |
| Picture in picture | Face over a screen recording | Resolve: face clip at 32 percent size, bottom left in safe zone, 22 px rounded corners | Manual |
| Background removal | Face over a branded background | Resolve Magic Mask (Studio) or Canva background remover for stills | Manual, quality varies |
| Colour look | Consistent skin and warm blacks | Resolve: exposure and white balance first, then lift blacks to about 3 percent so they read as Kryz Black, gentle warmth | Manual |

## E. Audio

| Effect | Purpose | How | Settings | Status |
|---|---|---|---|---|
| Voice clean | Removes rumble and hiss | `normalize_audio.py` | high pass 80 Hz, FFT denoise 10 dB | Built |
| Loudness | Even volume across all videos | `normalize_audio.py` | -14 LUFS, -1 dBTP | Built |
| Music bed ducking | Music never fights the voice | Resolve Fairlight sidechain, or FFmpeg sidechaincompress | music around -28 LUFS under voice | Manual |
| Sound effects | Accent a callout or cut | Soft click on callout, low swoosh on title | Max one SFX per 5 s | Manual, licensed library needed |

## Log
- 2026-11-27: v0.1. Built entries render tested on a synthetic clip.
