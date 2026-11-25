# Changelog

All notable changes. Format: Keep a Changelog; versions follow SemVer.

## [0.1.0] — 2026-11-25 (pre-release, not published)
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
