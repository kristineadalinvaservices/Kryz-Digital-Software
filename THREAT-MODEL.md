# Threat model (STRIDE-style) — v0.1.0

Assets: user templates (may contain personal/business data), recipient values typed during personalization, keystrokes on approved sites, consent records, extension privileges.
Adversaries: malicious or compromised web page; malicious import file; another extension; local attacker with profile access; supply-chain compromise; future server compromise (not applicable to local-only).

| # | Threat | Vector | Mitigation | Test |
|---|---|---|---|---|
| T1 | Page reads templates | DOM access to extension UI | Closed shadow root; no web-accessible resources; content script never holds full library (only shortcut names + the one template requested) | e2e, scan |
| T2 | Page messages extension to exfiltrate | `chrome.runtime` from page | No `externally_connectable`; worker accepts only own content script, top frame, approved+granted origin | scan, unit (messages) |
| T3 | Keylogging by the extension | Expander reading input | Reads ≤32 chars before caret on `input` events only in safe fields; nothing stored or sent | unit (shortcuts), code review |
| T4 | Insert into password/payment/OTP | Expander or popup | `classifyField` + injected copy refuse password type, cc-/OTP autocomplete, sensitive names, sign-in/payment forms, read-only, opted-out | unit (17 cases), e2e (4 fields) |
| T5 | XSS via template/import content | Rendering | React text rendering; `textContent` in content script; safe Markdown subset; scan fails on HTML sinks | unit, e2e (import `<img onerror>`) |
| T6 | Prototype pollution via import | `__proto__` keys | `safeJsonParse` reviver drops `__proto__/prototype/constructor`; allow-list rebuild of objects | unit, e2e |
| T7 | Resource exhaustion via import | Huge file | 2 MB size check before reading; caps on templates/folders/field lengths | unit, e2e |
| T8 | Remote code / eval | Supply chain or code change | CSP `script-src 'self'`, `connect-src 'none'`; scan fails on eval/Function/fetch/XHR/WebSocket/remote script | scan |
| T9 | Data exfiltration over network | Any code path | No network APIs in bundle; CSP blocks connections from extension pages; e2e watches all requests | scan, e2e (0 external) |
| T10 | Over-broad permissions | Manifest | Required: storage/activeTab/scripting only; per-origin optional permissions | scan |
| T11 | Local attacker reads storage | Disk/profile access | **Not mitigated by encryption** — disclosed to users; warning on secret-looking content in editor | docs, UI |
| T12 | Dependency vulnerability | npm | Exact pins, lockfile, `npm audit` in gate (0 vulns at build), React only at runtime, SBOM | scan |
| T13 | Spoofed UI on page (fake Kryz prompt) | Page imitates chip | Chip never asks for credentials; personalization panel only appears after user's own expand key; documented | — (residual) |
| T14 | Page observes typed variable values | Page key listeners in capture phase | Values are destined for that page anyway; panel stops bubble propagation | residual, documented |
| T15 | Accidental expansion | Typing | Requires explicit key; Esc dismiss; token must follow whitespace; URLs ignored | unit, e2e |
| T16 | Stale consent | Policy changes | `POLICY_VERSIONS` bump forces re-acknowledgment | unit |

Residual risks: T11, T13, T14; untested real-world editors (Gmail/LinkedIn); a malicious extension with broad permissions could read pages independently of us.
