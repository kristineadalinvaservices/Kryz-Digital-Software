# Kryz Video System

The video production system for Kryz Digital Partners and Kryz Digital Software: brand rules, editing playbooks, SOPs and working automation. Separate from the Chrome extension; nothing here is bundled into it.

Status: **v0.1, initial deliverables for approval** (27 November 2026). Not yet used on real footage.

## Documents

| # | Document | Status |
|---|---|---|
| 1 | [Reverse engineering report](docs/01-reverse-engineering-report.md) | Blocked: reference videos could not be accessed; files requested |
| 2 | [Brand guide](docs/02-brand-guide.md) | Draft for approval |
| 3 | [Effects and animation library](docs/03-effects-library.md) | Draft |
| 4 | [Content type playbook](docs/04-content-type-playbook.md) | Draft |
| 5 | [Automation SOP](docs/05-automation-sop.md) | Draft, pipeline tested |
| 6 | [Repurposing SOP](docs/06-repurposing-sop.md) | Draft |
| 7 | [Drive and tracker SOP](docs/07-drive-and-tracker-sop.md) | Draft, 3 questions open |
| 8 | [QA checklist](docs/08-qa-checklist.md) | Draft |
| 9 | [Templates](docs/09-templates.md) | Built and render tested |

## Quick start

```bash
npm ci && pip install -r video-system/requirements.txt
python3 video-system/scripts/prepare_fonts.py
bash video-system/scripts/selftest.sh
```

## Safety rules built in

Scripts never write over the source file. Originals are only read. Nothing is uploaded or published by these tools.
