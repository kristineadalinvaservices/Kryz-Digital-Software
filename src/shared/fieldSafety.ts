/**
 * Decides whether an element is a field the extension may touch.
 * Security by default: anything we cannot positively classify as a normal text field is refused.
 * Used by the shortcut expander and the popup "Insert" action.
 *
 * NOTE: background/injectInsert.ts contains a self-contained copy of these rules because
 * functions injected with chrome.scripting cannot import modules. Keep them in sync;
 * tests/unit/fieldSafety.test.ts checks both.
 */

const ALLOWED_INPUT_TYPES = new Set(['', 'text', 'search', 'email', 'url']);

/** autocomplete tokens that indicate credentials, payment or one-time codes. */
const BLOCKED_AUTOCOMPLETE = /(current-password|new-password|one-time-code|cc-|card|csc|cvc|transaction|webauthn)/i;

/** name / id / aria-label / placeholder hints. */
const SENSITIVE_HINT =
  /(pass(word|wd|code|phrase)?|pwd|secret|token|api[-_ ]?key|otp|one[-_ ]?time|2fa|mfa|totp|verification[-_ ]?code|auth[-_ ]?code|security[-_ ]?(answer|question|code)|pin\b|cvv|cvc|csc|card[-_ ]?(number|no)|cc[-_]?(num|number)|credit|debit|iban|routing|account[-_ ]?(number|no)|ssn|social[-_ ]?security|tax[-_ ]?id)/i;

export type SafetyVerdict = { safe: true; kind: 'input' | 'textarea' | 'contenteditable' } | { safe: false; reason: string };

function hints(el: Element): string {
  const attrs = ['name', 'id', 'autocomplete', 'aria-label', 'placeholder', 'data-testid', 'class'];
  return attrs.map((a) => el.getAttribute(a) ?? '').join(' ');
}

function inAuthOrPaymentForm(el: Element): boolean {
  const form = el.closest('form');
  if (!form) return false;
  if (form.querySelector('input[type="password"]')) return true;
  if (form.querySelector('input[autocomplete*="cc-" i], input[autocomplete*="one-time-code" i]')) return true;
  return false;
}

function optedOut(el: Element): boolean {
  return Boolean(el.closest('[data-kryz-disable]'));
}

export function classifyField(el: Element | null): SafetyVerdict {
  if (!el) return { safe: false, reason: 'No field is focused.' };
  if (optedOut(el)) return { safe: false, reason: 'This field has opted out.' };

  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const input = el as HTMLInputElement;
    const type = (input.getAttribute('type') ?? '').toLowerCase();
    if (type === 'password') return { safe: false, reason: 'Password fields are never touched.' };
    if (!ALLOWED_INPUT_TYPES.has(type)) return { safe: false, reason: `Input type "${type}" is not supported.` };
    if (input.readOnly || input.disabled) return { safe: false, reason: 'Field is read-only.' };
    if (BLOCKED_AUTOCOMPLETE.test(input.autocomplete || '')) return { safe: false, reason: 'Sensitive field (autocomplete).' };
    if (SENSITIVE_HINT.test(hints(input))) return { safe: false, reason: 'Field looks sensitive.' };
    if (inAuthOrPaymentForm(input)) return { safe: false, reason: 'Field is part of a sign-in or payment form.' };
    return { safe: true, kind: 'input' };
  }
  if (tag === 'textarea') {
    const ta = el as HTMLTextAreaElement;
    if (ta.readOnly || ta.disabled) return { safe: false, reason: 'Field is read-only.' };
    if (BLOCKED_AUTOCOMPLETE.test(ta.getAttribute('autocomplete') ?? '')) return { safe: false, reason: 'Sensitive field (autocomplete).' };
    if (SENSITIVE_HINT.test(hints(ta))) return { safe: false, reason: 'Field looks sensitive.' };
    if (inAuthOrPaymentForm(ta)) return { safe: false, reason: 'Field is part of a sign-in or payment form.' };
    return { safe: true, kind: 'textarea' };
  }
  const html = el as HTMLElement;
  if (html.isContentEditable) {
    if (SENSITIVE_HINT.test(hints(html))) return { safe: false, reason: 'Field looks sensitive.' };
    if (inAuthOrPaymentForm(html)) return { safe: false, reason: 'Field is part of a sign-in or payment form.' };
    return { safe: true, kind: 'contenteditable' };
  }
  return { safe: false, reason: 'Focused element is not an editable text field.' };
}

/** Resolve the actual editable element (contenteditable roots, shadow roots, focused descendants). */
export function deepActiveElement(doc: Document): Element | null {
  let el: Element | null = doc.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  return el;
}
