/**
 * Shortcut rules and detection. Detection looks at no more than
 * LIMITS.expanderLookbehind characters immediately before the caret, and keeps nothing.
 */
import { LIMITS } from './constants';
import type { Template } from './types';

export const SHORTCUT_RE = /^\/[a-z0-9][a-z0-9_-]{0,29}$/;

export function normalizeShortcut(raw: string): string {
  let s = raw.trim().toLowerCase();
  if (s && !s.startsWith('/')) s = '/' + s;
  return s;
}

export type ShortcutCheck = { ok: true; value: string | null } | { ok: false; error: string };

export function validateShortcut(raw: string, templates: Template[], selfId?: string): ShortcutCheck {
  const value = normalizeShortcut(raw);
  if (!value) return { ok: true, value: null };
  if (value.length > LIMITS.shortcutMaxChars) return { ok: false, error: 'Shortcuts can be at most 30 characters after the slash.' };
  if (!SHORTCUT_RE.test(value)) {
    return { ok: false, error: 'Use a slash, then letters, numbers, dashes or underscores (for example /intro).' };
  }
  const clash = templates.find((t) => t.shortcut === value && t.id !== selfId);
  if (clash) return { ok: false, error: `“${value}” is already used by “${clash.title}”.` };
  return { ok: true, value };
}

/** Templates that share a shortcut (possible after older imports). */
export function findDuplicateShortcuts(templates: Template[]): Map<string, Template[]> {
  const map = new Map<string, Template[]>();
  for (const t of templates) {
    if (!t.shortcut) continue;
    const list = map.get(t.shortcut) ?? [];
    list.push(t);
    map.set(t.shortcut, list);
  }
  for (const [k, v] of map) if (v.length < 2) map.delete(k);
  return map;
}

const TRAILING_TOKEN = /(?:^|[\s(])(\/[a-z0-9][a-z0-9_-]{0,29})$/i;

/**
 * Given up to N characters before the caret, return the shortcut-shaped token that ends
 * exactly at the caret, if any. The token must start the text or follow whitespace,
 * so "http://x" or "and/or" never match.
 */
export function trailingShortcutToken(textBeforeCaret: string): string | null {
  const window = textBeforeCaret.slice(-LIMITS.expanderLookbehind);
  const m = TRAILING_TOKEN.exec(window);
  if (!m || !m[1]) return null;
  // If the window was truncated, the token must not be the very start of a longer word.
  const start = window.length - m[1].length;
  if (start === 0 && textBeforeCaret.length > window.length) {
    const prev = textBeforeCaret.charAt(textBeforeCaret.length - window.length - 1);
    if (prev && !/\s/.test(prev)) return null;
  }
  return m[1].toLowerCase();
}
