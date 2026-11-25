/**
 * Validation for anything that crosses a trust boundary: import files, runtime messages,
 * and form input. Strict allow-list parsing; unknown fields are dropped.
 */
import { LIMITS, SCHEMA_VERSION } from './constants';
import { SHORTCUT_RE, normalizeShortcut } from './shortcuts';
import type { Folder, Template } from './types';
import { newId } from './ids';

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/** JSON.parse that drops prototype-pollution keys at every depth. */
export function safeJsonParse(text: string): unknown {
  return JSON.parse(text, (key, value) => (FORBIDDEN_KEYS.has(key) ? undefined : value));
}

/** Remove control characters except tab/newline/carriage return. Keeps text as text. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}

function cleanTimestamp(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 8.64e15 ? Math.floor(v) : fallback;
}

const ID_RE = /^([a-z]{1,3})_[a-f0-9]{8,64}$/;

export function cleanId(v: unknown, prefix: string): string {
  if (typeof v !== 'string') return newId(prefix);
  const m = ID_RE.exec(v);
  return m && m[1] === prefix ? v : newId(prefix);
}

export function cleanTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out = new Set<string>();
  for (const t of v) {
    const s = cleanText(t, LIMITS.tagChars).trim().toLowerCase();
    if (s) out.add(s);
    if (out.size >= LIMITS.maxTagsPerTemplate) break;
  }
  return [...out];
}

export interface ImportIssue {
  level: 'warning' | 'error';
  message: string;
}

export interface ParsedLibrary {
  templates: Template[];
  folders: Folder[];
  issues: ImportIssue[];
}

/**
 * Validate an exported library file. Accepts both "library" and "all data" exports.
 * Returns cleaned data plus human-readable issues. Never throws for content problems.
 */
export function parseLibraryImport(text: string, now = Date.now()): ParsedLibrary {
  const issues: ImportIssue[] = [];
  if (new Blob([text]).size > LIMITS.importBytes) {
    return { templates: [], folders: [], issues: [{ level: 'error', message: 'File is larger than 2 MB.' }] };
  }
  let data: unknown;
  try {
    data = safeJsonParse(text);
  } catch {
    return { templates: [], folders: [], issues: [{ level: 'error', message: 'File is not valid JSON.' }] };
  }
  if (!isPlainObject(data) || data.format !== 'kryz-quick-reply') {
    return { templates: [], folders: [], issues: [{ level: 'error', message: 'This is not a Kryz Quick Reply export file.' }] };
  }
  if (typeof data.schemaVersion !== 'number' || data.schemaVersion > SCHEMA_VERSION) {
    issues.push({ level: 'warning', message: 'File comes from a newer version. Unknown fields were ignored.' });
  }

  const folders: Folder[] = [];
  const folderIds = new Set<string>();
  const rawFolders = Array.isArray(data.folders) ? data.folders : [];
  for (const f of rawFolders.slice(0, LIMITS.maxFolders)) {
    if (!isPlainObject(f)) continue;
    const name = cleanText(f.name, LIMITS.folderNameChars).trim();
    if (!name) continue;
    const id = cleanId(f.id, 'f');
    if (folderIds.has(id)) continue;
    folderIds.add(id);
    folders.push({ id, name, createdAt: cleanTimestamp(f.createdAt, now) });
  }

  const templates: Template[] = [];
  const ids = new Set<string>();
  const shortcuts = new Set<string>();
  const rawTemplates = Array.isArray(data.templates) ? data.templates : [];
  if (rawTemplates.length > LIMITS.maxTemplates) {
    issues.push({ level: 'warning', message: `Only the first ${LIMITS.maxTemplates} templates were read.` });
  }
  let skipped = 0;
  for (const t of rawTemplates.slice(0, LIMITS.maxTemplates)) {
    if (!isPlainObject(t)) {
      skipped++;
      continue;
    }
    const title = cleanText(t.title, LIMITS.titleChars).trim();
    const body = cleanText(t.body, LIMITS.bodyChars);
    if (!title || !body.trim()) {
      skipped++;
      continue;
    }
    let id = cleanId(t.id, 't');
    if (ids.has(id)) id = newId('t');
    ids.add(id);

    let shortcut: string | null = null;
    if (typeof t.shortcut === 'string' && t.shortcut.trim()) {
      const s = normalizeShortcut(t.shortcut);
      if (SHORTCUT_RE.test(s) && !shortcuts.has(s)) {
        shortcut = s;
        shortcuts.add(s);
      } else {
        issues.push({ level: 'warning', message: `Shortcut on “${title}” was invalid or duplicated and was removed.` });
      }
    }
    const folderId = typeof t.folderId === 'string' && folderIds.has(t.folderId) ? t.folderId : null;
    const createdAt = cleanTimestamp(t.createdAt, now);
    templates.push({
      id,
      title,
      description: cleanText(t.description, LIMITS.descriptionChars),
      body,
      shortcut,
      folderId,
      tags: cleanTags(t.tags),
      favorite: t.favorite === true,
      pinned: t.pinned === true,
      createdAt,
      updatedAt: cleanTimestamp(t.updatedAt, createdAt),
      starter: t.starter === true,
    });
  }
  if (skipped) issues.push({ level: 'warning', message: `${skipped} item(s) were skipped because they were empty or malformed.` });
  if (!templates.length && !folders.length) issues.push({ level: 'error', message: 'No usable templates were found in this file.' });
  return { templates, folders, issues };
}

/** Allow only http(s) URLs when the user saves a meeting link. */
export function isSafeHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Origins the user may enable shortcuts on. Browser-internal and store pages are refused. */
export function siteOriginFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.hostname === 'chromewebstore.google.com' || (u.hostname === 'chrome.google.com' && u.pathname.startsWith('/webstore'))) return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function originToMatchPattern(origin: string): string {
  return `${origin}/*`;
}
