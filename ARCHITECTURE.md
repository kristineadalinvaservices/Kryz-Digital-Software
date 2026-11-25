# Architecture

Chrome Manifest V3 · TypeScript (strict) · React 19 · Vite 8 (pages) + esbuild (worker, content script) · chrome.storage.local

```
src/
  shared/        Pure logic, no chrome.* — types, constants, variables, shortcuts, validation,
                 messages, fieldSafety, analytics, starterTemplates, ids
  storage/       adapter.ts (StorageAdapter: ChromeLocalAdapter | MemoryAdapter)
                 schema.ts (defaults + versioned migrations) · repository.ts (all business operations)
  background/    index.ts (service worker) · injectInsert.ts (self-contained insert function)
  content/       index.ts (shortcut expander, closed shadow-DOM UI)
  ui/            theme/ (tokens.css, app.css, theme.ts) · components/ (Brand, ui, icons, Personalize)
                 popup/ · dashboard/ (App router + pages) · hooks/useStore · sites.ts · tabActions.ts
public/theme-boot.js   sets data-theme before first paint (no flash)
docs/legal/*.md        Privacy Policy + Terms, bundled and rendered in-app with a safe Markdown subset
```

## Components and trust boundaries
| Context | Trust | Can do |
|---|---|---|
| Popup / dashboard (extension pages) | Trusted | Read/write storage through `repository`; request optional permissions on click; run `insertIntoFocusedField` in the active tab |
| Service worker | Trusted | Migrations, trash purge, open onboarding, (un)register expander for approved+granted origins, answer validated content-script requests |
| Content script (isolated world) | Semi-trusted (runs on web pages) | Never touches storage; asks the worker for the shortcut list, one template by shortcut, and to record a use |
| Web page | **Untrusted** | Cannot message the extension (no `externally_connectable`, no web-accessible resources); cannot read the closed shadow root |

## Key decisions (plain language)
- **Local-first storage behind an adapter.** Everything goes through `StorageAdapter`, so cloud sync can be added later by writing a new adapter, without touching screens.
- **No content script by default.** The expander is registered dynamically only for sites the user approved and Chrome granted (`chrome.scripting.registerContentScripts`). Revoking or removing a site unregisters it immediately.
- **Popup insertion uses `activeTab`.** One click on the toolbar icon gives temporary access to that tab only, so no "read all websites" permission is needed.
- **Schema versioning.** `meta.schemaVersion`; `migrateData` runs N→N+1 steps on install/update, fills new keys with defaults and never downgrades newer data.
- **Validation at every boundary.** Runtime messages (`parseContentRequest`), imports (`parseLibraryImport` with prototype-pollution-safe JSON), forms (`saveTemplate`).
- **Rendering is text-only.** React escapes text; the content script builds UI with `textContent`; the Markdown renderer emits elements, never HTML.
- **Themes.** CSS custom properties on `:root[data-theme]`; preference stored in settings and mirrored to page `localStorage` only for the pre-paint boot script.

## Storage schema v1 (`chrome.storage.local` keys)
`meta {schemaVersion, installedAt}` · `templates Template[]` · `folders Folder[]` · `trash {template, deletedAt}[]` · `settings` (theme, motion, expansionEnabled, expandKey, expansionSites, typingWpm, profile{senderName, meetingLink}) · `consent` (versions + timestamps) · `usage {byTemplate, byDay, byFolder}`.

## Future SaaS readiness
- `StorageAdapter` → `CloudSyncAdapter` (server-authorized, tenant-isolated; see SECURITY.md "Future cloud").
- Plans/entitlements: add `src/shared/entitlements.ts` consulted by `repository` limits (`LIMITS`); privacy controls are never gated.
- Team libraries: templates gain `ownerId/teamId/approved` fields via a schema migration.
