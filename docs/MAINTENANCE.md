# Maintenance guide

## Everyday changes
- Text/copy: UI strings live in the page components under `src/ui/`. Legal text: `docs/legal/*.md` (bump `POLICY_VERSIONS` if material).
- Colours/spacing: `src/ui/theme/tokens.css`; run `node scripts/contrast.mjs` after any colour change.
- Starter templates: `src/shared/starterTemplates.ts`.
- Limits (import size, lengths, retention): `src/shared/constants.ts` `LIMITS`.

## Changing stored data
1. Edit types in `src/shared/types.ts`.
2. Increase `SCHEMA_VERSION`, add `MIGRATIONS[oldVersion]` in `src/storage/schema.ts` (never delete user content).
3. Add a unit test in `tests/unit/repository.test.ts` ("schema migrations").

## Dependencies
Monthly: `npm outdated`, update exact versions, `npm ci`, `npm run check`, `npm run test:e2e`. Only React ships at runtime; keep it that way. Review licences (gate enforces permissive licences).

## Before each release
Follow RELEASE-CHECKLIST.md. Never commit `.env`, keys, or real user data. Never upload/publish without owner approval.

## Debugging
`npm run build:dev` → load `dist-dev/` (source maps). Service worker: `chrome://extensions` → Inspect views. Do not add `console.log` of user content (gate fails).
