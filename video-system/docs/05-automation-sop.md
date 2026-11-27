# Doc 5: AI Video Editing and Automation SOP

Version 0.1, 27 November 2026. All tools here are free and open source. No new subscriptions are needed to start.

## 1. Tool stack and why

| Job | Tool | Cost | Status in this workspace |
|---|---|---|---|
| Cutting, audio, reframing, export | FFmpeg | Free | Installed, tested |
| Captions burned in brand fonts | FFmpeg with libass, brand fonts converted from the repo | Free | Tested |
| Transcription with word timings | faster-whisper (Whisper, runs locally) | Free | Script written, **not run here**: its model download host is blocked in this cloud workspace |
| Motion graphics | HTML and CSS templates rendered by Playwright to transparent video | Free | Tested |
| Face centred crop | OpenCV | Free | Script written, optional install |
| Fine editing, colour, speed ramps, masks | DaVinci Resolve (free version) | Free | On your computer |
| Quick social edits | CapCut or Canva (existing) | Existing | On your computer |

Remotion was considered for graphics. I chose plain HTML and CSS rendered by Playwright instead: it does the same job here with no extra framework, and Remotion's licence needs checking for company use. MoviePy was not needed because FFmpeg does every step directly and faster. Blender is only worth it for 3D logo work, which the brand rules forbid anyway (the logo is never redrawn).

## 2. One time setup (on any computer)

```bash
# From the repo root
npm ci                                    # brings the brand fonts (OFL licence)
pip install -r video-system/requirements.txt
npm i -g playwright && npx playwright install chromium   # skip in this cloud workspace: already installed
python3 video-system/scripts/prepare_fonts.py
bash video-system/scripts/selftest.sh     # must end with all PASS
```

## 3. The pipeline, step by step

| Step | Command | Output |
|---|---|---|
| 1. Copy raw from Drive to a local working folder (never edit in 01_Raw Footage) | | |
| 2. Transcript | `python3 transcribe.py RAW.mp4 work/` | words.json, .srt, transcript.md |
| 3. Pick clips | Read transcript.md, fill the extraction plan (Doc 6) | |
| 4. Trim the clip | `ffmpeg -ss 00:03:10 -to 00:03:52 -i RAW.mp4 -c copy work/R001-C01_src.mp4` then re-transcribe the clip, or pass the full words.json and trim timings | |
| 5. Everything else in one go | `python3 pipeline.py work/R001-C01_src.mp4 --rec R001 --content C01 --platforms reels,tiktok,shorts,youtube --words work/R001-C01_src.words.json --keywords "leads,system" --mode youtube=fill --face --logo --graphic lower-third.mov@1.0 --out out/` | Final files per platform, render report |
| 6. Graphics | `node render_graphics.mjs title-card out/hook.mov --w 1080 --h 1920 --duration 3 --p '{"title":"Stop chasing [every] detail"}'` | Transparent .mov |
| 7. Cover and thumbnail | `node render_graphics.mjs reel-cover out/cover.png --p '{"title":"...","photo":"frame.jpg"}'` | PNG |
| 8. Fine edit if needed | Import the cut and the .mov graphics into Resolve | Project file in 10_Editable Project Files |
| 9. QA | Doc 8 | QA report |
| 10. Upload and tracker | Doc 7 | |

Every script refuses to write over its input, and keeps intermediates in `_work/` so a revision does not start from zero.

## 4. What is automated and what is not

Automated now: dead air removal, loudness and voice clean up, aspect ratio conversion (crop, face crop, blurred fill), branded captions and SRT, logo watermark, timed graphics overlay, motion graphics rendering, covers and thumbnails from templates, file naming, render report, reference video analysis.

Planned: automatic punch ins on alternate cuts, music bed with ducking, before and after template, chart template, Drive upload and tracker update via the Google connectors (needs your approval of the tracker first).

Human (or Claude reviewing frames) always: choosing clips, hooks, B roll choice, checking captions in Tagalog and Bisaya, the creative look of each video, final QA.

## 5. Reusable prompts for Claude

- **Footage analysis:** "New footage in 01_Raw Footage: [file]. Run the Doc 6 analysis: timestamped transcript, key moments, hooks, matched pillars and approved captions, and a content extraction plan. Do not edit yet."
- **Edit:** "Edit plan items [IDs] using Doc 4 framework [type]. Platforms: [list]. Use the approved caption from [link]. Put drafts in 05_For Review and update the tracker."
- **Revision:** "Revision for [Content ID] v02: [notes]. Keep everything else the same."
- **Performance review:** "Here are last month's numbers [link]. Apply Doc 11 analysis and propose playbook changes. Do not change the visual identity."

## 6. Limits and what I need

- **Transcription model:** allow `huggingface.co` in this workspace's network settings, or run `transcribe.py` once on your computer.
- **Music and sound effects:** no licensed source chosen. Options: YouTube Audio Library (free, YouTube use), platform native sounds when posting, or a paid library such as Epidemic Sound or Artlist (cost, needs your approval). Until then videos ship with voice only or with music added natively in the app.
- **Rendering speed:** this workspace has no GPU. Short form renders in about real time; long form is better rendered in Resolve on your computer.
- **Platform specs:** values in `presets/platforms.json` are working defaults and must be checked against current platform documentation before the first real export (Doc 7, step V1).

## Log
- 2026-11-27: v0.1. Pipeline self test passed (sizes, durations, loudness -13.9 LUFS, alpha graphics, original untouched).
