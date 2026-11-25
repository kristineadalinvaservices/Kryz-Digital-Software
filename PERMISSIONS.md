# Permissions and why each is needed

| Permission | Type | Why | What it does NOT allow |
|---|---|---|---|
| `storage` | Required | Save templates, folders, settings, consent and usage counts in `chrome.storage.local` on this device. | Sync or upload (not used). |
| `activeTab` | Required | When the user clicks the toolbar icon, grants temporary access to that one tab so **Insert** can place a message into the focused field. | Background access to any tab; reading pages the user did not invoke the extension on. |
| `scripting` | Required | Run the self-contained insert function in that tab, and register the shortcut expander **only** on sites the user approved. | Running on sites without a matching granted host permission. |
| `https://*/*`, `http://*/*` | **Optional** host permissions | Requested **one origin at a time** (e.g. `https://mail.google.com/*`) when the user turns shortcuts on for that site. | Anything until the user approves in Chrome's prompt. Revocable in Settings, Privacy Center or `chrome://extensions`. |

Not requested: `tabs`, `history`, `cookies`, `webRequest`, `clipboardRead`, `<all_urls>` at install, `identity`, `notifications`, `unlimitedStorage`, `externally_connectable`, web-accessible resources.

**Denied permission:** nothing changes and the user sees "Chrome did not grant access". **Revoked permission:** the worker removes the site from settings and unregisters the expander; already-running scripts stop on the next field focus because the worker answers `enabled: false`.

The e2e test build (`npm run build:e2e`, `dist-e2e/`) adds `host_permissions` for `localhost`/`127.0.0.1` only so automation can avoid prompts. It is never packaged; `security-scan.mjs` fails if production has host permissions.

## Chrome Web Store justification text (draft)
- storage: "Stores the user's templates and settings locally on their device."
- activeTab: "Inserts a template into the text field the user selected, only after the user clicks the extension and chooses Insert."
- scripting: "Places the chosen text into the focused field and runs the optional shortcut feature only on websites the user approves."
- Optional host permissions: "Requested per website, only when the user enables text shortcuts for that website."
