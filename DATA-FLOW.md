# Data flow

```
 User ──types/clicks──► Popup / Dashboard (extension pages)
                           │  repository.* (validated)
                           ▼
                    chrome.storage.local  (this device only)
                           ▲
                           │ loadAll / recordUsage
                    Service worker ◄──── validated messages ──── Content script (approved sites only)
                           │                                          │ reads ≤32 chars before caret, in memory only
                           │ registerContentScripts(approved∩granted) │ inserts text into the focused safe field
                           ▼                                          ▼
                    Chrome permissions                           Web page field (user reviews & sends)

 Popup "Insert" ──activeTab + scripting──► insertIntoFocusedField(text) in the current tab
 Export ──► JSON file download (user's disk)      Import ◄── user-selected JSON file (≤2 MB, validated)
 Network: none. CSP connect-src 'none'. Verified: 0 external requests in e2e.
```

| Data | Source | Stored | Leaves device? |
|---|---|---|---|
| Templates, folders, tags | User / import | storage.local | Only by user copy/insert/export |
| Variable values typed in personalization | User | **Not stored** (in memory once) | Only inside the inserted message |
| Shortcut detection window | Page field, ≤32 chars | **Not stored** | No |
| Matched shortcut name (e.g. `/intro`) | Content script | No | No (content script → worker, same extension) |
| Usage counts, words, dates | Extension | storage.local | Only by "Export all my data" |
| Sender name, meeting link | User (optional) | storage.local | Only inside messages / export |
| Consent versions + dates | Onboarding | storage.local | Only by export |
| Theme/motion preference | Settings | storage.local + page localStorage mirror | No |
