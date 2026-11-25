# Privacy & data handling (internal summary)

Public-facing drafts: `docs/legal/PRIVACY-POLICY.md` (rendered in-app at Privacy Policy) and `docs/legal/THIRD-PARTY-INTEGRATIONS.md`.

## Commitment (verified against v0.1.0 behaviour)
| Claim | Verified by |
|---|---|
| We do not sell your personal information | No data leaves the device (network scan + e2e: 0 external requests) |
| We do not use your private content to train AI models | No AI processing, no network |
| We do not collect unrelated browsing activity | No `tabs`/`history`/`webRequest`; expander only on approved origins; reads ≤32 chars before caret, stores nothing |
| We do not access your passwords or payment credentials | Field safety rules (unit + e2e) |
| Templates and personalizations remain in your browser | storage.local only; personalization values not stored |
| We do not transmit saved content to our servers | CSP `connect-src 'none'`, scan, e2e |
| Only necessary permissions | storage/activeTab/scripting + per-site optional |
| You can export or delete your information | Privacy Center: export all, delete all (e2e verifies empty storage) |

## Data handling policy
- Collect only what features need (DATA-FLOW.md). No telemetry, crash reporting, ads or third-party scripts.
- Never log message content (scan enforces no `console.log` in source).
- Usage stats store counts and word totals, never inserted text.
- Users are told local storage is not encryption and warned against storing secrets (onboarding, Privacy Center, editor warning).

## Regulatory notes (for legal review — not a compliance claim)
- **Philippine Data Privacy Act of 2012 (RA 10173):** in the local-only version Kryz Digital Partners does not receive or process users' personal data; confirm whether any registration/notification duties still arise from distribution.
- **GDPR / UK GDPR:** same analysis; if cloud features arrive, Kryz becomes controller/processor → lawful basis, DPA with processors, international transfer mechanism, DSAR handling, breach notification (72 h) and ROPA needed.
- **US state laws (e.g. CCPA/CPRA):** no sale/share of personal information; confirm thresholds.
- **Chrome Web Store User Data Policy / Limited Use:** disclose data handling in the Privacy practices tab; certify Limited Use (see docs/store/CHROME-WEB-STORE-LISTING.md).
