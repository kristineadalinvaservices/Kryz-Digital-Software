/**
 * Runtime message contract between the content script and the background service worker.
 * Every message is validated on receipt. Unknown shapes are rejected.
 */
import { SHORTCUT_RE } from './shortcuts';

export type ContentRequest =
  | { type: 'kqr/getShortcuts' }
  | { type: 'kqr/resolveShortcut'; shortcut: string }
  | { type: 'kqr/recordUse'; templateId: string; words: number };

export interface ShortcutSummary {
  shortcut: string;
  title: string;
}

export type GetShortcutsResponse = { enabled: boolean; expandKey: 'Tab' | 'Enter'; shortcuts: ShortcutSummary[] };
export type ResolveShortcutResponse =
  | { found: true; templateId: string; title: string; body: string; senderName: string; meetingLink: string }
  | { found: false };

const TEMPLATE_ID_RE = /^t_[a-f0-9]{8,64}$/;

export function parseContentRequest(msg: unknown): ContentRequest | null {
  if (typeof msg !== 'object' || msg === null || Array.isArray(msg)) return null;
  const m = msg as Record<string, unknown>;
  switch (m.type) {
    case 'kqr/getShortcuts':
      return { type: 'kqr/getShortcuts' };
    case 'kqr/resolveShortcut':
      return typeof m.shortcut === 'string' && SHORTCUT_RE.test(m.shortcut) ? { type: 'kqr/resolveShortcut', shortcut: m.shortcut } : null;
    case 'kqr/recordUse':
      return typeof m.templateId === 'string' &&
        TEMPLATE_ID_RE.test(m.templateId) &&
        typeof m.words === 'number' &&
        Number.isInteger(m.words) &&
        m.words >= 0 &&
        m.words < 100000
        ? { type: 'kqr/recordUse', templateId: m.templateId, words: m.words }
        : null;
    default:
      return null;
  }
}
