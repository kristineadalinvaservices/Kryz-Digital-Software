# Doc 7: Google Drive and Content Tracker SOP

Version 0.1, 27 November 2026. **Nothing in Drive has been created, moved or changed yet.** This SOP is for approval first.

## 1. What already exists (found in your Drive, read only)

- **Content Calendar.md** (Owner Kristine, reviewed 18 Oct 2026): six core units KRYZ 001 to 006, a per asset record, the status flow Brief → Draft → Media Ready → QA → Changes → Approved → Scheduled → Published, and four production folders: Raw, Working, Review, Approved.
- **M1 Content Calendar (ACCLA System)** spreadsheet: a course worksheet for a sample client, not a Kryz tracker.
- **ContentCreator_Tracker.xlsx** (March 2026): purpose unknown.

Your brief says not to create a duplicate tracker. So before I build anything, please confirm (see the questions at the end).

## 2. Folder structure

Proposed: keep your four existing folders and map them into the brief's structure, so nothing moves and no links break.

| Brief folder | Existing folder |
|---|---|
| 01_Raw Footage | Raw (existing) |
| 04_Work in Progress | Working (existing) |
| 05_For Review | Review (existing) |
| 08_Approved Final Content | Approved (existing) |
| 00_Brand Assets, 02, 03, 06 (with platform subfolders), 07, 09, 10, 11 | New, inside one parent `CONTENT PRODUCTION` folder |

Rules: originals in 01 are read only; never delete or overwrite. Every export is a new version. Project files (Resolve .drp, graphics .mov, .ass captions, edit lists) go to 10.

## 3. Naming

```
Recording:   KRYZ-REC-20261127-R001_short-topic.mp4
Final:       KRYZ-20261127-R001-C03_reels_1080x1920_v01.mp4
Cover:       KRYZ-20261127-R001-C03_reels_cover_v01.png
Project:     KRYZ-20261127-R001-C03_project_v01.zip
```
Date = production date. R = recording, C = content piece. Platform codes: tiktok, reels, fb_reel, fb_feed_45, square, x_landscape, shorts, youtube. Versions go up on every revision (v01, v02); approved files keep their version number.

## 4. Production statuses

The brief's 14 statuses and your calendar's 8 overlap. Proposed mapping (keeps your calendar words where they exist):

| Brief status | Calendar status |
|---|---|
| Raw Footage Received, Footage Analyzed, Content Identified | Brief |
| Awaiting Caption Approval | Brief |
| Ready for Editing, Editing in Progress, Rendering | Draft |
| (assets complete) | Media Ready |
| Quality Assurance | QA |
| Ready for Review | QA passed, awaiting your review |
| Revision Required | Changes |
| Approved | Approved |
| Scheduled | Scheduled |
| Published | Published |
| Repurposing Opportunity | (new) |

Your calendar's rule stays: a file in Approved does not approve later edits.

## 5. Tracker

One row per platform version. Columns: `templates/tracker/content-tracker-columns.csv` (the brief's fields plus ICE type, approval owner and date, publish account, reach, engagements and qualified inquiries from your calendar). Update after each milestone: analysed, edited, QA, review, approved, scheduled, published, and when metrics arrive.

## 6. Approval process

1. Claude sets status Ready for Review and puts files in 05.
2. You review in Drive and comment or reply with changes.
3. Revisions: new version number, status Changes, then back to QA.
4. You approve in writing (comment or message). Claude records who and when.
5. Publishing only by you, or by Claude only with explicit authorisation for that post.

## 7. Before the first real export (V1)

Check current specs, safe zones and duration limits for each platform against official help pages and update `presets/platforms.json` with the date checked.

## Questions for you

1. Which file is the online content tracker: the Content Calendar.md record, ContentCreator_Tracker.xlsx, or none yet (then I create one Google Sheet from the column template)?
2. OK to use the existing Raw, Working, Review and Approved folders as 01, 04, 05 and 08?
3. OK with the status mapping above?

## Log
- 2026-11-27: v0.1. Drive read only; no changes made.
