# Doc 1: Video Inspiration and Reverse Engineering Report

Status: **Blocked, awaiting the original video files.** Version 0.1, 27 November 2026.

## 1. What happened

I could not watch any of the six reference videos. This cloud workspace blocks YouTube (the connection is refused before the page loads), and I have no other way to see the picture or hear the audio.

Your brief says not to invent timestamps, effects or observations from a title or transcript. So this report contains **no observations yet**. Nothing below describes what is in those videos.

| # | Purpose | Link | Access | Observed |
|---|---|---|---|---|
| R1 | Product introduction | youtu.be/PTr5T87ViW4 | Blocked | Nothing |
| R2 | Demo and system/service sales | youtu.be/FtNWrBUOJ24 | Blocked | Nothing |
| R3 | Demo and system/service sales | youtu.be/aSte18D2_YE | Blocked | Nothing |
| R4 | Demo and system/service sales | youtu.be/5bP-hRzKoK4 | Blocked | Nothing |
| R5 | Long form | youtube.com/watch?v=aMxcZY6aIFU | Blocked | Nothing |
| R6 | Long form | youtube.com/watch?v=vb8WJgRAKUU | Blocked | Nothing |
| R7+ | Short form, affiliate, digital product | Not yet provided | | |

## 2. What I need from you

Upload the six videos as files (MP4 or MOV) to Drive, in `CONTENT PRODUCTION/00_Brand Assets/Reference Videos/`, named `R1.mp4` to `R6.mp4`. A screen recording of each video playing is fine if you cannot download it. Only use copies you are allowed to keep for internal study; these files are never published or reused in our content.

Then add the short form and affiliate reference links (R7 onward) the same way.

## 3. How each video will be analysed (ready to run)

For every file, `scripts/analyze_reference.py` produces an evidence pack:

- `cuts.csv`: every hard cut with its timestamp and shot length (the editing pace, measured).
- `frames/`: a still at every cut, plus one every half second for the first 10 seconds (the hook).
- `contact_sheet.jpg`: all shots on one page, with timestamps.
- `audio.csv`: loudness per second, which shows music drops, sound effect hits and silences.
- `summary.json`: cuts per minute, cuts in the first 3 and 10 seconds, average shot length.

Then I look at the frames and the audio map and fill in the breakdown table below for every technique, marking each row **Observed** (visible in the frames or measurable) or **Inferred** (likely, but not directly provable from frames, for example the exact easing curve or the tool used).

## 4. Breakdown template (one per video)

**Video:** R# · Title · Duration · Format · Measured pace: cuts/min, average shot length

**Structure:** storytelling framework, section map with timestamps.

**Hook:** first 3 seconds (visual, spoken, on screen text); seconds 5 to 10; what happens straight after the hook.

| Time | Effect | What happens | Purpose | Why it works | How to recreate | Tool | Settings | Automatable | Kryz adaptation | Formats | Observed or inferred |
|---|---|---|---|---|---|---|---|---|---|---|---|

Checklist of categories every breakdown covers: framing and composition, angle changes, jump cuts, punch in and out, dynamic zooms, speed ramps, freeze frames, motion tracking, masking, background removal, split screen, picture in picture, screen recording presentation, product demos, cursor highlighting, animated callouts, motion graphics, animated typography, lower thirds, title animations, subtitle style, text highlighting, transitions, B roll placement, sound effects, music, audio transitions, colour grade, lighting, pattern interrupts, retention techniques, CTAs, closing sequence.

## 5. Until then

Docs 2 to 9 are built from your brand guidelines, business playbook and content calendar, plus standard editing practice. They do not borrow anything from the reference videos. When this report is filled in, I will update Doc 3 (effects library) and Doc 4 (playbooks) with what the references actually do, and mark each change.

## Log
- 2026-11-27: Created. All six references blocked; no observations recorded; file request made.
