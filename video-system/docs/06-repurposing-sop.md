# Doc 6: Multi Platform Content Repurposing SOP

Version 0.1, 27 November 2026. One recording becomes several useful pieces, never filler.

## 1. Footage analysis (status: Footage Analyzed)

1. Watch or review the whole recording; generate the transcript (`transcribe.py`).
2. Mark moments in `transcript.md` with tags: `HOOK` (strong standalone line), `TEACH` (clear lesson), `STORY` (personal moment), `PROOF` (real result, permission needed), `HOT` (bold or contrarian take), `DEMO` (system shown), `CUT` (off topic, private or confidential).
3. Match each moment to a content pillar and an approved caption or calendar item (for example KRYZ 001 to 006 in the Content Calendar).
4. A moment becomes a piece only if it makes sense on its own, delivers something, and is not a repeat of another piece in the same batch.

## 2. Content extraction plan (one per recording)

| Content ID | Source timestamps | Type (Doc 4) | Pillar | ICE type | Hook (spoken) | Hook title | Approved caption? | Platforms | Priority |
|---|---|---|---|---|---|---|---|---|---|

Rule of thumb, not a target: a 10 minute recording usually gives 1 long form or none, 3 to 6 short clips, 1 to 2 quote graphics, 1 teaser. Fewer is fine.

If a new hook, caption or CTA materially changes approved messaging, its status is **Awaiting Caption Approval** and it is not edited until approved.

## 3. Platform versions

Each piece gets its own version per platform, not one upload everywhere.

| Platform | Size | Hook | Pace | Captions | Cover | Post copy | CTA |
|---|---|---|---|---|---|---|---|
| TikTok | 1080x1920 | Native, casual, start mid sentence | Fastest | Burned in, karaoke OK | Reel cover | Short, conversational, 3 to 5 hashtags | Comment or follow |
| Instagram Reels | 1080x1920 | Strong opening visual | Fast | Burned in, keyword | Branded cover, text in centre band for the grid | Built for saves and shares | Save, share, DM keyword |
| Facebook Page | 1080x1920 Reels; 1080x1350 or 1080x1080 feed | Clear and accessible | Medium | Larger, keyword | Cover | Plain, story led | Message the Page |
| X | 1920x1080, 1080x1080 or 1080x1920 | Direct opinion or insight first | Medium | Burned in (sound off) | | 1 to 2 short lines | Reply or link |
| YouTube Shorts | 1080x1920 | Strong hook | Fast | Burned in | Cover | Search friendly title | Subscribe or watch the long video |
| YouTube long form | 1920x1080 min | Cold open | Calm to Medium | SRT upload | Thumbnail | Search titled, chapters | Mid roll and end screen |
| LinkedIn (in the current calendar, not in the video brief) | 1080x1350 or 1080x1080 | Professional insight | Medium | Burned in | | Lesson led | Comment or DM |

Hashtags only where the platform uses them. No emojis in designs; post copy follows the brand voice (no dashes, real proof only).

## 4. Export settings

H.264 High, CRF 18, yuv420p, AAC 192 kbps 48 kHz, -14 LUFS, faststart. 30 fps unless the source is 25 or 60. `pipeline.py` applies these.

## 5. Platform version checklist

Size correct; text inside the platform safe zone; hook changed for the platform if needed; caption written for the platform from the approved caption; cover or thumbnail made; CTA right for the platform; file named per Doc 7.

## Log
- 2026-11-27: v0.1.
