# Security incident response procedure (draft)

Roles: **Incident lead** = product owner (Kryz Digital Partners founder) until a security owner is appointed. **Engineering** = maintainer of this repository. **Legal adviser** = to be appointed.

1. **Receive** — reports arrive via the security contact (to be published). Log date, reporter, affected version, summary in a private tracker. Acknowledge within 3 business days.
2. **Assess** — reproduce on the latest build. Rate severity: *Critical* (remote code, silent data exfiltration, bypass of sensitive-field protection), *High* (cross-site access without permission, data loss), *Medium*, *Low*.
3. **Contain** — Critical/High: consider unpublishing or pausing the store listing (owner approval) and advising users to disable the extension.
4. **Fix** — patch on a branch; add a regression test (unit or e2e); run `npm run check` + `npm run test:e2e`; peer/independent review for Critical/High.
5. **Release** — bump version, CHANGELOG security entry, package, owner approval, submit update. Chrome auto-updates installed copies.
6. **Communicate** — material incidents: notice in the store listing/download page and to the reporter; credit if wanted.
7. **Notification review** — with legal adviser, decide on obligations (Philippine NPC 72-hour notification for personal data breaches, GDPR Art. 33/34, US state laws). In the local-only version user data is not held by Kryz, which narrows but does not eliminate this review.
8. **Post-incident** — root cause, lessons, update THREAT-MODEL.md and SECURITY-TESTING.md.

## Security changelog
Record security-relevant fixes under a "Security" heading in CHANGELOG.md. None to date.
