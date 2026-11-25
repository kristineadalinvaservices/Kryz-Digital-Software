# Testing

## Automated
| Suite | Command | Result (2026-11-25, Linux, Node 22, Chromium via Playwright 1.63) |
|---|---|---|
| Type check | `npm run typecheck` | Pass |
| Unit (Vitest + jsdom) | `npm test` | **58/58 pass** — variables, shortcuts, validation/import, messages, analytics, repository CRUD/trash/folders/consent/import-export/delete-all, migrations, field safety (17 field cases + popup insert function), search/sort |
| End-to-end (real extension in Chromium) | `npm run test:e2e` | **29/29 pass** — report: `tests/e2e/last-run.json`, screenshots: `tests/e2e/screenshots/` |
| Security gate | `npm run audit:security` | **16/16 pass**, 19/19 contrast pairs pass |

E2E covers: install → onboarding; unchecked consents; consent recording; legal pages; create templates; duplicate shortcut detection; search; theme switch, persistence and no-flash; System → Signature; enabling a site registers the expander only there; expansion in textarea/input/contenteditable; undo; variables panel; Esc; refusal in password, sign-in username, card and OTP fields; analytics; popup list + insert into the active tab; malicious/oversized/wrong-format import; export; restart persistence; Privacy Center; removing a site stops expansion; delete-all erases storage; no CSP violations; zero external network requests.

### E2E limitations (honest)
- `chrome.action.openPopup()` is unavailable in headless Chromium, so the popup page runs in a background tab; its Insert still targets the active test tab through the real `activeTab`/`scripting` code path.
- Chrome permission prompts cannot be clicked by automation; the e2e build pre-grants `localhost` only. The real prompt-and-revoke flow on optional permissions must be checked manually (below).
- Only a generic local test page was automated. **Gmail and LinkedIn are not tested** (need real accounts and a person). Do not claim compatibility until the manual checks below pass.

## Manual checklist (run on Chrome stable, Windows or macOS, before each release)
Record date, Chrome version, OS, tester and pass/fail in `docs/RELEASE-READINESS.md`.
1. Load `dist/` unpacked; welcome opens; both consents unchecked; links open Privacy Policy and Terms.
2. Pin the extension; toolbar icon shows the official symbol (after logo is installed) and is legible at 16 px.
3. Popup: search, filters, Copy (paste elsewhere), Insert into a Google Docs-free plain textarea (e.g. a contact form) and into Gmail compose.
4. Variables: personalize, preview, Insert disabled until all filled.
5. Shortcuts: from popup on mail.google.com click **Turn on** → Settings → **Allow on this site** → Chrome prompt → Allow. Type `/intro` + Tab in Gmail compose body; in LinkedIn message box; confirm text and cursor position; Ctrl/Cmd+Z.
6. Deny the Chrome prompt on another site → nothing enabled, message shown.
7. Revoke via `chrome://extensions` → Site access → remove; shortcuts stop on that site; Settings no longer lists it.
8. Password, card number and 2FA fields on real sign-in/checkout pages: shortcut does not expand; popup Insert refuses.
9. Themes: Light, Kryz Signature, System (toggle OS dark mode). Restart Chrome; no wrong-theme flash.
10. Keyboard only: Tab through popup and dashboard; visible focus; dialogs trap focus and close with Esc. Screen reader smoke test (VoiceOver/NVDA) on onboarding and popup.
11. Reduced motion: OS setting on → no animations.
12. Import a previously exported file (merge, replace). Export all data.
13. Delete all extension data → welcome screen; `chrome://extensions` → Inspect service worker → `chrome.storage.local.get(null)` returns `{}`.
14. Update path: install previous version, add data, load new version → data intact.
15. DevTools Network on popup/dashboard: no requests except `chrome-extension://`.
