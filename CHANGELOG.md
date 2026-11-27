# Changelog

All notable changes. Format: Keep a Changelog; versions follow SemVer.

## Video system v0.1 (2026-11-27, separate from the extension)
- Added `video-system/`: nine draft documents for approval (brand guide, effects library, 18 content type playbooks, automation, repurposing, Drive and tracker, QA, templates); the reference video report is blocked pending video files.
- Working pipeline: dead air removal, loudness, reframing, branded captions, logo and graphics overlay; nine HTML motion graphic templates rendered to transparent video. Self test passes on a synthetic clip.

## [0.1.0] (pre-release, not published)
### Brand (2026-11-25)
- Official Kryz logo integrated (onboarding, popup, sidebar, About, empty states) and official extension icons 16/32/48/128.
- Colours, radii and glow updated to Brand Guidelines v2; Light theme uses Warm White instead of pure white.
- Manrope, Instrument Serif and Inter bundled locally (SIL OFL 1.1); licence notices shipped in `licenses/`.
- Dashes removed from user-facing copy per brand voice.

### Added
- Template library: create, edit, duplicate, delete with 30-day recovery, folders, tags, favorites, pins, search, five sort orders.
- Dynamic variables with personalization form and live preview; sender name and meeting link from optional saved details.
- Copy and popup Insert into the focused field (activeTab).
- Per-site text shortcut expansion with explicit Tab/Enter, Esc dismiss, undo support, closed shadow-DOM prompt.
- 13 optional starter templates.
- Local analytics with estimated time saved and configurable typing speed.
- Light, Kryz Signature and System themes; motion preference; no startup flash.
- Onboarding with privacy commitment and separate, unchecked privacy acknowledgment and Terms acceptance.
- Privacy & Security Center: status, permissions, revoke, export all, clear stats, empty trash, delete all, reset.
- Import/export with validation, 2 MB limit, merge/replace.
- Draft Privacy Policy and Terms rendered in-app.
### Security
- Strict CSP (`connect-src 'none'`, no unsafe-*), no remote code, validated runtime messages and imports, sensitive-field protection, static security gate, SBOM.
