# Security testing report

Build: v0.1.0 · Date: 2026-11-25 · Environment: Linux container, Node 22, Chromium (Playwright 1.63, new headless). Results below are copied from real runs (`tests/e2e/last-run.json`, `tests/security-scan-last-run.json`). Not an independent audit.

## Static security gate (`npm run audit:security` on production `dist/`)
| Status | Check | Detail |
|---|---|---|
| PASS | Required permissions are minimal | activeTab,scripting,storage |
| PASS | No install-time host permissions |  |
| PASS | No static content scripts (expander registered per approved site only) |  |
| PASS | No web-accessible resources |  |
| PASS | Not externally connectable (web pages cannot message the extension) |  |
| PASS | CSP has script-src 'self' |  |
| PASS | CSP has object-src 'none' |  |
| PASS | CSP has connect-src 'none' |  |
| PASS | CSP has base-uri 'none' |  |
| PASS | CSP has no unsafe-eval / unsafe-inline / remote sources |  |
| PASS | Production manifest name | Kryz Quick Reply |
| PASS | Scanned 8 built files for eval/Function/network APIs/remote code |  |
| INFO | URL strings present in bundle (not requests; e.g. React error-doc links, XML namespaces) | https://react.dev, http://www.w3.org |
| PASS | Scanned 39 source files for HTML injection sinks and logging |  |
| PASS | Secret scan: 70 files, no credentials found |  |
| PASS | npm audit: no high/critical vulnerabilities | {"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0} |
| PASS | Shipped dependency licences reviewed (permissive) | react@19.3.1 (MIT), react-dom@19.3.1 (MIT), scheduler@0.28.0 (MIT) |

## Dynamic tests (`npm run test:e2e`, minified build + test-only localhost permission)
| # | Test | Result | Note |
|---|---|---|---|
| 1 | Onboarding opens automatically on install | PASS |  |
| 2 | Consent checkboxes are not preselected and gate "Get started" | PASS |  |
| 3 | Accepting records policy versions + dates and adds optional starter templates | PASS | 13 templates; privacy 2026-11-25-draft |
| 4 | Legal documents render from bundled drafts | PASS |  |
| 5 | Create templates (with and without variables) | PASS |  |
| 6 | Duplicate shortcuts are detected in the editor | PASS |  |
| 7 | Search filters the template list | PASS |  |
| 8 | Theme: Light → Kryz Signature applies instantly and persists without flash | PASS |  |
| 9 | System theme follows OS dark mode → Kryz Signature | PASS |  |
| 10 | Enable shortcuts for the test site (registers expander only there) | PASS | http://localhost:38975/* |
| 11 | Expander: /plain + Tab expands in a textarea | PASS |  |
| 12 | Expander: undo (Ctrl+Z) restores the typed shortcut | PASS | "Hi /plain" |
| 13 | Expander: variables open a personalization panel; inserted text is correct | PASS |  |
| 14 | Expander: contenteditable editor | PASS |  |
| 15 | Expander: Escape dismisses; Tab then behaves normally | PASS |  |
| 16 | Expander never operates in password field | PASS |  |
| 17 | Expander never operates in username in sign-in form | PASS |  |
| 18 | Expander never operates in payment card field | PASS |  |
| 19 | Expander never operates in one-time code field | PASS |  |
| 20 | Usage is recorded locally and shown in Analytics | PASS | 3 uses recorded |
| 21 | Popup lists templates and inserts into the focused page field | PASS | openPopup unavailable in headless; popup page opened in a background tab, Insert used on the active test tab |
| 22 | Import rejects malicious content safely (prototype pollution, oversized, wrong format) | PASS |  |
| 23 | Export library produces a valid file | PASS | 16 templates exported |
| 24 | Data persists after browser restart | PASS | 16 templates after restart |
| 25 | Privacy Center shows verified status and site access | PASS |  |
| 26 | Removing a site disables expansion there immediately | PASS |  |
| 27 | Delete all data requires typed confirmation and erases everything | PASS |  |
| 28 | Extension pages produced no CSP violations | PASS |  |
| 29 | No network requests left the device (only local test site + extension files) | PASS | external requests: 0 |

## Unit-level security tests (`npm test`, 58 pass)
Prototype pollution (`__proto__`, nested `constructor.prototype`), oversized import, wrong format, HTML/script kept as inert text, control-character stripping, ID/shortcut sanitisation, unsafe URL schemes (`javascript:`, `data:`, `file:`), runtime message allow-list (9 malformed payloads rejected), 17 sensitive/non-sensitive field classifications for both the expander and the injected popup function, consent gating, migration never downgrades newer data.

## Accessibility contrast (`scripts/contrast.mjs`)
19/19 token pairs meet WCAG 2.2 AA (lowest: Signature pink on card 5.37:1).

## Findings and status
| ID | Severity | Finding | Status |
|---|---|---|---|
| F1 | Info | Stored data is not encrypted by the extension | Accepted; disclosed in UI and policy |
| F2 | Low | A hostile page can observe keystrokes typed into the in-page personalization panel (capture-phase listeners) | Accepted; values are destined for that page; documented (THREAT-MODEL T14) |
| F3 | Low | Page could draw a fake look-alike prompt | Residual; our UI never asks for secrets |
| F4 | Medium (process) | Optional-permission prompt/revoke flow and real Gmail/LinkedIn behaviour not automated | Open → manual checklist in TESTING.md |
| F5 | Medium (process) | No independent human security review yet | Open → required before public release |

No known unresolved critical or high-severity vulnerabilities.
