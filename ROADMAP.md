# Roadmap (future SaaS) — proposals, nothing activated

## Near term (0.2)
- Install official logo/fonts; manual Gmail/LinkedIn verification; independent security review; store submission (owner approval).
- Iframe editor support (opt-in per site), keyboard shortcut to open a template picker in-page, template version history.
- Firefox/Edge builds.

## Free / Pro / Team (requires owner approval; billing off until approved)
| Tier | Proposed | Architecture hook |
|---|---|---|
| Free | Limited templates, basic folders, copy/insert, basic shortcuts | `entitlements.ts` read by `repository` limits |
| Pro | Unlimited templates, advanced variables (conditional, dropdown), cloud sync, advanced analytics, AI-assisted writing | `CloudSyncAdapter` implementing `StorageAdapter`; AI behind explicit per-action consent |
| Team | Shared libraries, roles, approved templates, central admin | schema migration adding `teamId/ownerId/approved`; server-side authorization |

Privacy controls (export, delete, revoke, Privacy Center) are never paid features.

## Before any cloud/AI/integration ships
SECURITY.md "Future cloud requirements", updated Privacy Policy + store disclosures, new consent version, DPA/sub-processor list, data residency decision, incident runbook updated, independent review.
