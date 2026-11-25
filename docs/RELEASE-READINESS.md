# Release readiness report — v0.1.0 (2026-11-25)

**Verdict: NOT ready for public release.** Ready for private, owner-led testing by loading `dist/` unpacked.

| Area | Status |
|---|---|
| Core features (templates, variables, copy/insert, shortcuts, analytics, themes, onboarding, Privacy Center) | Working; automated tests pass (58 unit, 29 e2e) |
| Security gate (static) | 19/19 pass; 0 npm vulnerabilities; strict CSP; no network; no remote code |
| Accessibility | Contrast 27/27 AA; keyboard + focus implemented; screen-reader pass **not done** |
| Branding | Official logo, icons, colours and fonts (Guidelines v2) integrated and visually checked; owner sign-off pending |
| Real-site compatibility | **Not verified** on Gmail/LinkedIn (manual test needed) |
| Permission prompt/revoke UX | Implemented; **manual verification pending** |
| Legal | Drafts only; **legal review + owner approval pending**; public policy URL needed |
| Security contact | **Missing** |
| Independent security review | **Not done** (recommended before public distribution; required before cloud/AI/payments) |

## Known limitations
Fields inside iframes unsupported · some rich editors may reject inserted text (falls back to Copy) · no cross-device sync · local storage is not encrypted · e2e uses headless Chromium on Linux only.

## Manual test log
| Date | Chrome | OS | Tester | Result |
|---|---|---|---|---|
| — | — | — | — | not yet run |
