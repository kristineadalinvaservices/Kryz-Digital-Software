# Kryz Quick Reply

**Save, personalize and insert the messages you send again and again.**
An official product of **Kryz Digital Partners** · part of **Kryz Digital Software**
*Built for productivity. Designed for privacy.*

Kryz Quick Reply is a local-first Chrome extension (Manifest V3) for virtual assistants, freelancers, recruiters, sales and support teams. Templates live on your device. Nothing is uploaded.

## What it does

- Template library: create, edit, duplicate, delete (with 30-day recovery), folders, tags, favorites, pins, search, sort.
- Dynamic variables: `{{first_name}}`, `{{company}}`, `{{meeting_link}}`, custom ones; personalization form + live preview. Recipient details are never invented.
- Copy in one click, or **Insert** into the field you selected on the current tab.
- Text shortcuts such as `/intro`, `/followup`, `/invoice` on websites **you** approve. Nothing expands until you press Tab (or Enter).
- Optional starter library of 13 templates.
- Local analytics: uses, daily/weekly activity, most-used templates, by folder, estimated time saved.
- Light, Kryz Signature (dark) and System themes.
- Privacy & Security Center with export, deletion, permission review and revocation.

## Install (developer / unpacked)

1. Install Node.js 22+.
2. `npm ci`
3. `npm run build` → creates `dist/`
4. Chrome → `chrome://extensions` → turn on **Developer mode** → **Load unpacked** → choose `dist/`.
5. The welcome screen opens. Read and accept, then start.

Installable ZIP for the Chrome Web Store: `npm run package` → `release/kryz-quick-reply-v<version>.zip` (+ `.sha256`, SBOM). **Do not upload without product-owner approval** (see RELEASE-CHECKLIST.md).

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run build:dev` | Readable build with source maps into `dist-dev/` |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | 58 unit tests (Vitest + jsdom) |
| `npm run test:e2e` | Loads the extension in Chromium and runs 29 end-to-end checks (needs Playwright + Chromium: `npx playwright install chromium` on your machine) |
| `npm run audit:security` | Static security gate (19 checks) + WCAG contrast check on `dist/` |
| `npm run package` | Build, security gate, ZIP, checksum, SBOM |
| `npm run check` | typecheck + unit tests + build + security gate |

## Official brand
Logo, icons, colours and fonts follow **Kryz Brand Guidelines v2** (files in `brand/`, details in BRAND.md). Brand fonts (Manrope, Instrument Serif, Inter) are bundled locally under the SIL Open Font License.

## Documentation

PRD.md · ARCHITECTURE.md · BRAND.md · PROGRESS.md · CHANGELOG.md · TESTING.md · ROADMAP.md · SECURITY.md · PRIVACY.md · PERMISSIONS.md · THREAT-MODEL.md · DATA-FLOW.md · SECURITY-TESTING.md · TERMS.md · DATA-RETENTION.md · INCIDENT-RESPONSE.md · RELEASE-CHECKLIST.md · docs/MAINTENANCE.md · docs/RELEASE-READINESS.md · docs/store/ · docs/legal/
