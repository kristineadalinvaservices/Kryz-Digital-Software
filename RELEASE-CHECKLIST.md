# Release checklist & security gate

Public release is **blocked** until every item is checked and the product owner signs off.

## Mandatory security gate
- [x] `npm run check` passes (typecheck, unit, build, static security gate, contrast), 2026-11-25
- [x] `npm run test:e2e` passes on the release commit: 29/29, 2026-11-25
- [x] No known unresolved critical/high vulnerabilities (`npm audit`: 0)
- [x] Permissions justified (PERMISSIONS.md); production manifest has no host permissions
- [x] Sensitive-field protections tested (unit + e2e)
- [x] Data handling matches disclosures (PRIVACY.md table)
- [x] External network requests reviewed: none
- [x] Import/export and deletion verified
- [x] Known limitations documented (TESTING.md, About page)
- [x] Official branding verified: Guidelines v2 logo, icons, colours and fonts integrated; visually checked in both themes (2026-11-25). Owner sign-off on screenshots still recommended
- [ ] Manual checklist (TESTING.md) passed on Windows and macOS, incl. Gmail and LinkedIn
- [ ] Optional permission prompt / deny / revoke verified manually
- [ ] Independent human security review completed
- [ ] Chrome Web Store policies re-checked at submission time (program policies, User Data/Limited Use, MV3 remote-code rule, single purpose, listing quality)

## Legal & content
- [ ] Privacy Policy and Terms legally reviewed and approved by owner; hosted at a public HTTPS URL for the store listing
- [ ] Security contact and company contact supplied; `SECURITY_CONTACT` set
- [ ] Store listing text + privacy practices form approved (docs/store/)
- [ ] Promotional images produced from official assets (docs/store/PROMO-ASSETS.md)

## Build & ship (owner approval required for each)
1. Bump `version` in package.json; update CHANGELOG.md.
2. `npm ci && npm run package` → `release/*.zip`, `.sha256`, SBOM.
3. Load the ZIP contents unpacked once more and smoke test.
4. Owner uploads to the Chrome Web Store developer dashboard (we never upload without explicit approval).
5. Tag the commit `v<version>`.

## Rollback
Chrome Web Store cannot downgrade users. To roll back: rebuild the last good commit with a **higher** version number, submit it, and if urgent unpublish the listing meanwhile. Storage migrations never delete data and refuse to downgrade newer schemas, so a rolled-back build leaves user data intact.
