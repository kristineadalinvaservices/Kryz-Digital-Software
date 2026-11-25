# Security policy

## Principles applied
Privacy by Design · Security by Default · Least privilege · Data minimization · Defense in depth · Secure SDLC. Details: THREAT-MODEL.md, PERMISSIONS.md, SECURITY-TESTING.md.

## Reporting a vulnerability (Security Disclosure Policy — draft)
**Security contact: not yet assigned.** The product owner must supply an approved address (e.g. a dedicated mailbox) before public release; it will be shown in the Privacy & Security Center (`SECURITY_CONTACT` in `src/shared/constants.ts`) and the store listing.

When published, the policy is:
- Please report privately to the security contact. Do not include other people's personal data or private template content.
- We aim to acknowledge within 3 business days and give a status update within 10 business days. *(Targets to be confirmed by the owner.)*
- Good-faith research that avoids privacy violations, data destruction and service disruption will not be pursued legally. *(Legal review required.)*
- In scope: this extension's code and builds. Out of scope: third-party websites, social engineering, physical attacks.

## Supported versions
Only the latest published version receives security fixes.

## Secure development rules
See CLAUDE.md "Non-negotiables". Every release must pass `npm run check`, `npm run test:e2e` and RELEASE-CHECKLIST.md.

## Encryption statement
This version does **not** encrypt stored data beyond the protection Chrome and the operating system provide. If an encrypted local vault is approved later it must use Web Crypto (AES-GCM authenticated encryption, PBKDF2/Argon2-class key derivation with a unique salt, CSPRNG IVs), document key loss = data loss, and receive an independent security review. No custom cryptography.

## Future cloud requirements (before any sync, AI or integration ships)
HTTPS/TLS only · encryption at rest · secure authentication (no long-lived tokens in extension storage without review) · server-side authorization on every request · per-user/tenant isolation · roles for Team · secrets in a managed secret store (never in extension code) · rate limiting · retention + deletion controls · access-control tests · updated privacy disclosures and fresh, separate user authorization · independent security review.
