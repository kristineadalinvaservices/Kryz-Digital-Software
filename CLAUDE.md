# Agent instructions — Kryz Quick Reply

Keep this file identical in substance to AGENTS.md.

## Product
Chrome MV3 extension, local-first. Owner: Kryz Digital Partners (founder is not a programmer: explain decisions in plain language). Brand rules: BRAND.md. Never draw, regenerate or substitute the logo; official files go in `brand/logo/`.

## Non-negotiables
- No network requests from extension code. CSP has `connect-src 'none'`; `scripts/security-scan.mjs` fails on fetch/XHR/WebSocket/eval.
- No remote code, no `eval`/`new Function`, no `innerHTML`/`dangerouslySetInnerHTML`, no `console.log` of content.
- Required permissions stay `storage`, `activeTab`, `scripting`. Site access only via optional host permissions, one origin at a time, after a user click.
- Never operate in password, payment, OTP or sign-in form fields (`src/shared/fieldSafety.ts` + its copy in `src/background/injectInsert.ts` — keep both in sync).
- The expander reads at most ~32 chars before the caret, stores nothing, and never auto-expands.
- Never invent recipient data. Never send messages for the user.
- Validate every runtime message (`src/shared/messages.ts`) and every import (`src/shared/validation.ts`).
- Privacy claims in UI/docs must match behaviour. Do not claim encryption, certification or legal compliance.
- Do not publish, deploy, or upload without explicit owner approval.

## Workflow
`npm run check` and `npm run test:e2e` must pass before a commit is called done. Update PROGRESS.md and CHANGELOG.md each phase. Bump `POLICY_VERSIONS` in `src/shared/constants.ts` when legal text changes materially; add a migration in `src/storage/schema.ts` when the stored shape changes.

## Layout
`src/shared` pure logic · `src/storage` adapter/schema/repository · `src/background` service worker · `src/content` expander · `src/ui` React (popup, dashboard, components, theme) · `tests/unit` · `tests/e2e` · `scripts` build/scan/package · `docs/legal` legal drafts rendered in-app.
