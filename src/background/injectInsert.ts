/**
 * Self-contained function injected into the active tab (activeTab + scripting) when the user
 * clicks "Insert" in the popup. It must not reference anything outside its own body,
 * because chrome.scripting serializes it.
 *
 * It refuses password, payment, one-time-code and other sensitive fields, inserts only at
 * the user's current caret, and returns a result. It reads nothing from the page except
 * what is needed to classify the focused field.
 */
export interface InsertResult {
  ok: boolean;
  reason?: string;
}

export function insertIntoFocusedField(text: string): InsertResult {
  const ALLOWED = ['', 'text', 'search', 'email', 'url'];
  const BLOCKED_AC = /(current-password|new-password|one-time-code|cc-|card|csc|cvc|transaction|webauthn)/i;
  const SENSITIVE =
    /(pass(word|wd|code|phrase)?|pwd|secret|token|api[-_ ]?key|otp|one[-_ ]?time|2fa|mfa|totp|verification[-_ ]?code|auth[-_ ]?code|security[-_ ]?(answer|question|code)|pin\b|cvv|cvc|csc|card[-_ ]?(number|no)|cc[-_]?(num|number)|credit|debit|iban|routing|account[-_ ]?(number|no)|ssn|social[-_ ]?security|tax[-_ ]?id)/i;

  if (typeof text !== 'string' || !text) return { ok: false, reason: 'Nothing to insert.' };

  let el: Element | null = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  if (!el || el === document.body) return { ok: false, reason: 'Click into a text field on the page first, then open Kryz Quick Reply.' };
  if (el.closest('[data-kryz-disable]')) return { ok: false, reason: 'This field has opted out.' };

  const hint = ['name', 'id', 'autocomplete', 'aria-label', 'placeholder', 'data-testid', 'class'].map((a) => el!.getAttribute(a) ?? '').join(' ');
  const form = el.closest('form');
  const authForm = !!form && !!form.querySelector('input[type="password"], input[autocomplete*="cc-" i], input[autocomplete*="one-time-code" i]');
  const tag = el.tagName.toLowerCase();

  if (tag === 'input' || tag === 'textarea') {
    const field = el as HTMLInputElement | HTMLTextAreaElement;
    const type = tag === 'input' ? (field.getAttribute('type') ?? '').toLowerCase() : '';
    if (type === 'password') return { ok: false, reason: 'Password fields are never touched.' };
    if (tag === 'input' && !ALLOWED.includes(type)) return { ok: false, reason: 'This kind of field is not supported.' };
    if (field.readOnly || field.disabled) return { ok: false, reason: 'This field is read-only.' };
    if (BLOCKED_AC.test(field.getAttribute('autocomplete') ?? '') || SENSITIVE.test(hint) || authForm) {
      return { ok: false, reason: 'This looks like a sign-in, payment or security field, so Kryz Quick Reply will not insert here.' };
    }
    field.focus();
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? start;
    field.setSelectionRange(start, end);
    let done = false;
    try {
      done = document.execCommand('insertText', false, text); // keeps the browser undo stack
    } catch {
      done = false;
    }
    if (!done || field.value.slice(start, start + text.length) !== text) {
      field.setRangeText(text, start, end, 'end');
      field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
    return { ok: true };
  }

  const html = el as HTMLElement;
  if (html.isContentEditable) {
    if (SENSITIVE.test(hint) || authForm) return { ok: false, reason: 'This looks like a sensitive field, so Kryz Quick Reply will not insert here.' };
    html.focus();
    const sel = window.getSelection();
    if (sel && (sel.rangeCount === 0 || !html.contains(sel.anchorNode))) {
      const r = document.createRange();
      r.selectNodeContents(html);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    let done = false;
    try {
      done = document.execCommand('insertText', false, text);
    } catch {
      done = false;
    }
    if (!done) return { ok: false, reason: 'This editor did not accept inserted text. Use Copy instead and paste with Ctrl+V / Cmd+V.' };
    return { ok: true };
  }
  return { ok: false, reason: 'Click into a text field on the page first, then open Kryz Quick Reply.' };
}
