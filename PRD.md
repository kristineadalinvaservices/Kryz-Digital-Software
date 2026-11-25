# Product Requirements — Kryz Quick Reply (MVP)

Owner: Kryz Digital Partners · Ecosystem: Kryz Digital Software · Status: MVP built, pre-release (2026-11-25)

## Problem
Professionals who message all day (VAs, freelancers, recruiters, sales, support, agency owners) retype the same intros, follow-ups, invoice reminders and interview invites. Existing tools often need accounts, sync content to servers, or run on every site.

## Goal
A local-first Chrome extension that makes reusable messages fast to find, personalize and insert, with privacy controls a non-technical user can verify. Architecture ready for later Free/Pro/Team tiers.

## Users
Virtual assistants, freelancers, recruiters, sales professionals, digital marketers, agency owners, customer support teams, business owners.

## Scope (MVP)
In: template CRUD, folders, tags, favorites, pins, search, sort, recovery (30 days), import/export, starter library, variables with personalization + preview, copy, insert into focused field (popup), per-site shortcut expansion, local analytics, three themes, onboarding with separate consents, Privacy & Security Center, legal drafts.
Out (later): cloud sync, accounts, AI writing, team libraries, billing, Firefox/Edge builds, iframe editors.

## User stories and acceptance criteria
| # | Story | Acceptance (tested) |
|---|---|---|
| 1 | As a new user I understand what is accessed before I start | Welcome opens on install; privacy commitment, permission and storage explanations; two **unchecked** consents; Get started disabled until both checked; versions + dates stored (e2e) |
| 2 | I create, edit, duplicate, delete and recover templates | Editor validates title/body/shortcut; duplicate drops shortcut; delete → Recently deleted with Undo; restore; purge after 30 days (unit + e2e) |
| 3 | I organize and find templates | Folders (create/rename/delete keeps templates), tags, favorites, pins; search across title/body/tags/shortcut; sort name/updated/created/usage (unit + e2e) |
| 4 | I personalize before sending | Variables detected; form + live preview; insert/copy blocked until filled; recipient fields never pre-filled (unit + e2e) |
| 5 | I insert into the field I'm typing in | Popup Insert places text at caret; refuses sensitive fields; falls back to Copy with message (unit + e2e) |
| 6 | I type `/intro` and expand intentionally | Only on approved sites; chip + Tab/Enter; Esc dismisses; undo works in textareas; password/payment/OTP/sign-in fields ignored (e2e) |
| 7 | I control website access | Sites added one at a time via Chrome prompt; remove = revoke; expander unregistered immediately (e2e) |
| 8 | I see my productivity | Totals, 7/30 days, top templates, by folder, estimated time saved labelled "estimate", configurable WPM, clear stats (unit + e2e) |
| 9 | I move or back up my library | Export JSON; import ≤2 MB, validated, preview, merge/replace with confirmation (unit + e2e) |
| 10 | I own my data | Export all, clear stats, empty trash, delete all (typed DELETE), reset; storage verified empty (e2e) |
| 11 | The product looks like Kryz | Light, Kryz Signature, System; instant switch; persisted; no startup flash; WCAG AA contrast (e2e + contrast script) |

## Non-functional
Local-only data; no network; least privilege; WCAG 2.2 AA contrast; keyboard operable; reduced motion; strict TypeScript; minimal dependencies (React only at runtime).

## Assumptions
- Brand colours taken from the Kryz Canva template set; typography not supplied → system font stack (see BRAND.md).
- "Categories" are implemented as folders; tags provide cross-cutting grouping.
- Time saved = words inserted ÷ user's typing speed (default 40 WPM).
- No paid limits are active; `entitlements` are deferred to Phase "Monetization" (ROADMAP.md).

## Open items for the product owner
Official logo files and brand guidelines · approved security contact and company contact details · legal review of Privacy Policy and Terms · confirmation of colour values (two sources differ, see BRAND.md) · approval before any store submission.
