import { beforeEach, describe, expect, it } from 'vitest';
import { classifyField } from '../../src/shared/fieldSafety';
import { insertIntoFocusedField } from '../../src/background/injectInsert';

function html(markup: string) {
  document.body.innerHTML = markup;
}

const cases: Array<[string, string, boolean]> = [
  ['plain text input', '<input id="f" type="text" name="message">', true],
  ['untyped input', '<input id="f">', true],
  ['textarea', '<textarea id="f"></textarea>', true],
  ['contenteditable', '<div id="f" contenteditable="true"></div>', true],
  ['password', '<input id="f" type="password">', false],
  ['hidden', '<input id="f" type="hidden">', false],
  ['number', '<input id="f" type="number">', false],
  ['card autocomplete', '<input id="f" autocomplete="cc-number">', false],
  ['one-time-code', '<input id="f" autocomplete="one-time-code">', false],
  ['otp by name', '<input id="f" name="otp_code">', false],
  ['cvv by placeholder', '<input id="f" placeholder="CVV">', false],
  ['security answer', '<input id="f" name="security_answer">', false],
  ['username in login form', '<form><input id="f" name="user"><input type="password"></form>', false],
  ['read-only', '<input id="f" readonly>', false],
  ['opted out', '<div data-kryz-disable><textarea id="f"></textarea></div>', false],
  ['not editable', '<div id="f"></div>', false],
  ['sensitive contenteditable', '<div id="f" contenteditable="true" aria-label="Enter password"></div>', false],
];

describe('sensitive field protection', () => {
  beforeEach(() => html(''));
  for (const [name, markup, safe] of cases) {
    it(`${safe ? 'allows' : 'refuses'} ${name}`, () => {
      html(markup);
      const el = document.getElementById('f')!;
      // jsdom does not implement isContentEditable; emulate the browser.
      if (el.getAttribute('contenteditable') === 'true') Object.defineProperty(el, 'isContentEditable', { value: true });
      expect(classifyField(el).safe).toBe(safe);
    });
  }

  it('popup insertion uses the same rules (self-contained copy)', () => {
    for (const [name, markup, safe] of cases) {
      if (markup.includes('contenteditable') || name === 'not editable') continue;
      html(markup);
      const el = document.getElementById('f') as HTMLInputElement;
      el.focus();
      const r = insertIntoFocusedField('Hello');
      expect(r.ok, name).toBe(safe);
      if (safe) expect(el.value).toBe('Hello');
    }
  });

  it('inserts at the caret and keeps surrounding text', () => {
    html('<textarea id="f">Dear , thanks</textarea>');
    const ta = document.getElementById('f') as HTMLTextAreaElement;
    ta.focus();
    ta.setSelectionRange(5, 5);
    expect(insertIntoFocusedField('Ana').ok).toBe(true);
    expect(ta.value).toBe('Dear Ana, thanks');
  });

  it('refuses when nothing is focused', () => {
    html('<p>hi</p>');
    (document.activeElement as HTMLElement | null)?.blur?.();
    expect(insertIntoFocusedField('x').ok).toBe(false);
  });
});
