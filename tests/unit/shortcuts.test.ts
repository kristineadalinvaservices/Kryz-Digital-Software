import { describe, expect, it } from 'vitest';
import { findDuplicateShortcuts, normalizeShortcut, trailingShortcutToken, validateShortcut } from '../../src/shared/shortcuts';
import type { Template } from '../../src/shared/types';

const t = (id: string, shortcut: string | null, title = id): Template => ({
  id, title, description: '', body: 'x', shortcut, folderId: null, tags: [], favorite: false, pinned: false, createdAt: 1, updatedAt: 1, starter: false,
});

describe('shortcut validation', () => {
  it('normalizes and accepts valid shortcuts', () => {
    expect(normalizeShortcut(' Intro ')).toBe('/intro');
    expect(validateShortcut('/follow-up_2', [])).toEqual({ ok: true, value: '/follow-up_2' });
    expect(validateShortcut('', [])).toEqual({ ok: true, value: null });
  });
  it('rejects invalid characters and length', () => {
    expect(validateShortcut('/hi there', []).ok).toBe(false);
    expect(validateShortcut('/<b>', []).ok).toBe(false);
    expect(validateShortcut('/' + 'a'.repeat(31), []).ok).toBe(false);
    expect(validateShortcut('/-x', []).ok).toBe(false);
  });
  it('detects duplicates but allows the same template to keep its shortcut', () => {
    const list = [t('t_1', '/intro', 'Intro')];
    const r = validateShortcut('/INTRO', list);
    expect(r.ok).toBe(false);
    expect(validateShortcut('/intro', list, 't_1').ok).toBe(true);
    expect(findDuplicateShortcuts([t('a', '/x'), t('b', '/x'), t('c', '/y')]).size).toBe(1);
  });
});

describe('trailing token detection', () => {
  it('finds a shortcut ending at the caret', () => {
    expect(trailingShortcutToken('Hello /intro')).toBe('/intro');
    expect(trailingShortcutToken('/Intro')).toBe('/intro');
    expect(trailingShortcutToken('line\n/followup')).toBe('/followup');
  });
  it('ignores URLs, paths and mid-word slashes', () => {
    expect(trailingShortcutToken('see https://x.com/intro')).toBeNull();
    expect(trailingShortcutToken('and/or')).toBeNull();
    expect(trailingShortcutToken('/intro more text')).toBeNull();
    expect(trailingShortcutToken('/intro ')).toBeNull();
  });
  it('looks at no more than the lookbehind window', () => {
    const long = 'x'.repeat(5000) + ' /intro';
    expect(trailingShortcutToken(long)).toBe('/intro');
    // A truncated window starting mid-word must not produce a match.
    expect(trailingShortcutToken('a' + '/b'.padEnd(32, 'c'))).toBeNull();
  });
});
