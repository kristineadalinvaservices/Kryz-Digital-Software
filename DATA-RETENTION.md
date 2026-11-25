# Data retention and deletion policy (draft)

| Data | Retention | How it is deleted |
|---|---|---|
| Templates, folders | Until the user deletes them | Delete → Recently deleted; Delete all; Reset; uninstall |
| Recently deleted templates | 30 days | Purged automatically on browser start/extension update; "Delete permanently"; "Empty"; Delete all |
| Usage statistics | Daily totals kept 400 days; per-template totals until template purged or stats cleared | Clear statistics; permanent template delete removes its stats; Delete all |
| Personalization values | Not retained | — |
| Expander caret window | Not retained (in memory during one event) | — |
| Settings, saved sender details, website list | Until changed | Settings; Delete all; Reset |
| Website permissions | Until revoked | Remove site; Privacy Center Revoke; Delete all/Reset revoke all; chrome://extensions |
| Consent records | Until Delete all/Reset (then re-collected) | Delete all; Reset |
| Theme mirror (page localStorage) | Only while non-default | Delete all; set theme to System |
| Exported files | **Outside our control** | User deletes the files |

**Delete all extension data / Reset** clears every `chrome.storage.local` key, the theme mirror, and all optional site permissions; verified by e2e (`storage.local.get(null)` is empty). **Uninstall:** Chrome removes the extension's storage. **Kryz servers:** hold no user data in the local-only version.
