/**
 * Business logic over the storage adapter. UI components call these functions;
 * they never touch chrome.storage directly.
 */
import { LIMITS, POLICY_VERSIONS, SCHEMA_VERSION } from '../shared/constants';
import { emptyUsage, recordUse } from '../shared/analytics';
import { newId } from '../shared/ids';
import { validateShortcut } from '../shared/shortcuts';
import { STARTER_TEMPLATES } from '../shared/starterTemplates';
import type { Folder, Settings, StoreShape, Template, TrashedTemplate } from '../shared/types';
import { cleanTags, cleanText, type ParsedLibrary } from '../shared/validation';
import type { StorageAdapter } from './adapter';
import { ALL_KEYS, defaultStore } from './schema';

export class ValidationError extends Error {}

export async function loadAll(adapter: StorageAdapter): Promise<StoreShape> {
  const raw = await adapter.get(ALL_KEYS);
  const d = defaultStore();
  return {
    meta: raw.meta ?? d.meta,
    templates: raw.templates ?? [],
    folders: raw.folders ?? [],
    trash: raw.trash ?? [],
    settings: { ...d.settings, ...(raw.settings ?? {}), profile: { ...d.settings.profile, ...(raw.settings?.profile ?? {}) } },
    consent: { ...d.consent, ...(raw.consent ?? {}) },
    usage: raw.usage ?? emptyUsage(),
  };
}

export interface TemplateInput {
  title: string;
  description: string;
  body: string;
  shortcut: string;
  folderId: string | null;
  tags: string[];
  favorite?: boolean;
  pinned?: boolean;
}

export async function saveTemplate(adapter: StorageAdapter, input: TemplateInput, id?: string, now = Date.now()): Promise<Template> {
  const { templates = [], folders = [] } = await adapter.get(['templates', 'folders']);
  const title = cleanText(input.title, LIMITS.titleChars).trim();
  const body = cleanText(input.body, LIMITS.bodyChars);
  if (!title) throw new ValidationError('Please give the template a title.');
  if (!body.trim()) throw new ValidationError('The message cannot be empty.');
  if (input.body.length > LIMITS.bodyChars) throw new ValidationError(`Messages can be up to ${LIMITS.bodyChars.toLocaleString()} characters.`);
  const sc = validateShortcut(input.shortcut, templates, id);
  if (!sc.ok) throw new ValidationError(sc.error);
  const folderId = input.folderId && folders.some((f) => f.id === input.folderId) ? input.folderId : null;
  const existing = id ? templates.find((t) => t.id === id) : undefined;
  if (id && !existing) throw new ValidationError('This template no longer exists.');
  if (!existing && templates.length >= LIMITS.maxTemplates) throw new ValidationError('Template limit reached for this device.');

  const template: Template = {
    id: existing?.id ?? newId('t'),
    title,
    description: cleanText(input.description, LIMITS.descriptionChars),
    body,
    shortcut: sc.value,
    folderId,
    tags: cleanTags(input.tags),
    favorite: input.favorite ?? existing?.favorite ?? false,
    pinned: input.pinned ?? existing?.pinned ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    starter: existing?.starter ?? false,
  };
  const next = existing ? templates.map((t) => (t.id === template.id ? template : t)) : [...templates, template];
  await adapter.set({ templates: next });
  return template;
}

export async function duplicateTemplate(adapter: StorageAdapter, id: string, now = Date.now()): Promise<Template> {
  const { templates = [] } = await adapter.get(['templates']);
  const src = templates.find((t) => t.id === id);
  if (!src) throw new ValidationError('Template not found.');
  const copy: Template = {
    ...src,
    id: newId('t'),
    title: `${src.title} (copy)`.slice(0, LIMITS.titleChars),
    shortcut: null, // shortcuts must stay unique
    pinned: false,
    createdAt: now,
    updatedAt: now,
    starter: false,
  };
  await adapter.set({ templates: [...templates, copy] });
  return copy;
}

export async function patchTemplate(adapter: StorageAdapter, id: string, patch: Partial<Pick<Template, 'favorite' | 'pinned' | 'folderId'>>): Promise<void> {
  const { templates = [] } = await adapter.get(['templates']);
  await adapter.set({ templates: templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
}

export async function trashTemplate(adapter: StorageAdapter, id: string, now = Date.now()): Promise<void> {
  const { templates = [], trash = [] } = await adapter.get(['templates', 'trash']);
  const t = templates.find((x) => x.id === id);
  if (!t) return;
  await adapter.set({
    templates: templates.filter((x) => x.id !== id),
    trash: [{ template: t, deletedAt: now }, ...trash],
  });
}

/** Restores from trash. If the shortcut is now taken, the shortcut is cleared and reported. */
export async function restoreTemplate(adapter: StorageAdapter, id: string): Promise<{ shortcutCleared: boolean }> {
  const { templates = [], trash = [], folders = [] } = await adapter.get(['templates', 'trash', 'folders']);
  const item = trash.find((x) => x.template.id === id);
  if (!item) return { shortcutCleared: false };
  const t = { ...item.template };
  let shortcutCleared = false;
  if (t.shortcut && templates.some((x) => x.shortcut === t.shortcut)) {
    t.shortcut = null;
    shortcutCleared = true;
  }
  if (t.folderId && !folders.some((f) => f.id === t.folderId)) t.folderId = null;
  await adapter.set({ templates: [...templates, t], trash: trash.filter((x) => x.template.id !== id) });
  return { shortcutCleared };
}

export async function deleteFromTrash(adapter: StorageAdapter, id: string): Promise<void> {
  const { trash = [], usage } = await adapter.get(['trash', 'usage']);
  const u = usage ?? emptyUsage();
  const byTemplate = { ...u.byTemplate };
  delete byTemplate[id];
  await adapter.set({ trash: trash.filter((x) => x.template.id !== id), usage: { ...u, byTemplate } });
}

export async function emptyTrash(adapter: StorageAdapter): Promise<void> {
  await adapter.set({ trash: [] });
}

export function purgeExpired(trash: TrashedTemplate[], now = Date.now()): TrashedTemplate[] {
  const cutoff = now - LIMITS.trashRetentionDays * 24 * 60 * 60 * 1000;
  return trash.filter((x) => x.deletedAt >= cutoff);
}

export async function autoPurgeTrash(adapter: StorageAdapter, now = Date.now()): Promise<number> {
  const { trash = [] } = await adapter.get(['trash']);
  const kept = purgeExpired(trash, now);
  if (kept.length !== trash.length) await adapter.set({ trash: kept });
  return trash.length - kept.length;
}

// ---------- Folders ----------

export async function createFolder(adapter: StorageAdapter, name: string, now = Date.now()): Promise<Folder> {
  const { folders = [] } = await adapter.get(['folders']);
  const clean = cleanText(name, LIMITS.folderNameChars).trim();
  if (!clean) throw new ValidationError('Folder name cannot be empty.');
  if (folders.some((f) => f.name.toLowerCase() === clean.toLowerCase())) throw new ValidationError('A folder with that name already exists.');
  if (folders.length >= LIMITS.maxFolders) throw new ValidationError('Folder limit reached.');
  const folder: Folder = { id: newId('f'), name: clean, createdAt: now };
  await adapter.set({ folders: [...folders, folder] });
  return folder;
}

export async function renameFolder(adapter: StorageAdapter, id: string, name: string): Promise<void> {
  const { folders = [] } = await adapter.get(['folders']);
  const clean = cleanText(name, LIMITS.folderNameChars).trim();
  if (!clean) throw new ValidationError('Folder name cannot be empty.');
  if (folders.some((f) => f.id !== id && f.name.toLowerCase() === clean.toLowerCase())) throw new ValidationError('A folder with that name already exists.');
  await adapter.set({ folders: folders.map((f) => (f.id === id ? { ...f, name: clean } : f)) });
}

/** Deleting a folder keeps its templates; they move to "No folder". */
export async function deleteFolder(adapter: StorageAdapter, id: string): Promise<void> {
  const { folders = [], templates = [] } = await adapter.get(['folders', 'templates']);
  await adapter.set({
    folders: folders.filter((f) => f.id !== id),
    templates: templates.map((t) => (t.folderId === id ? { ...t, folderId: null } : t)),
  });
}

// ---------- Settings & consent ----------

export async function updateSettings(adapter: StorageAdapter, patch: Partial<Settings>): Promise<Settings> {
  const { settings } = await adapter.get(['settings']);
  const d = defaultStore().settings;
  const next: Settings = { ...d, ...(settings ?? {}), ...patch, profile: { ...d.profile, ...(settings?.profile ?? {}), ...(patch.profile ?? {}) } };
  await adapter.set({ settings: next });
  return next;
}

export async function recordConsent(adapter: StorageAdapter, opts: { privacy: boolean; terms: boolean }, now = Date.now()): Promise<void> {
  if (!opts.privacy || !opts.terms) throw new ValidationError('Both the privacy acknowledgment and the Terms of Use acceptance are required.');
  const { consent } = await adapter.get(['consent']);
  await adapter.set({
    consent: {
      ...(consent ?? defaultStore().consent),
      privacyAckVersion: POLICY_VERSIONS.privacy,
      privacyAckAt: now,
      termsAcceptedVersion: POLICY_VERSIONS.terms,
      termsAcceptedAt: now,
      onboardingCompletedAt: now,
    },
  });
}

export function consentIsCurrent(c: StoreShape['consent']): boolean {
  return c.privacyAckVersion === POLICY_VERSIONS.privacy && c.termsAcceptedVersion === POLICY_VERSIONS.terms && c.onboardingCompletedAt !== null;
}

// ---------- Usage ----------

export async function recordUsage(adapter: StorageAdapter, templateId: string, words: number, now = new Date()): Promise<void> {
  const { usage, templates = [] } = await adapter.get(['usage', 'templates']);
  const t = templates.find((x) => x.id === templateId);
  if (!t) return;
  await adapter.set({ usage: recordUse(usage ?? emptyUsage(), templateId, t.folderId, words, now) });
}

export async function clearUsage(adapter: StorageAdapter): Promise<void> {
  await adapter.set({ usage: emptyUsage() });
}

// ---------- Starter library ----------

export async function addStarterTemplates(adapter: StorageAdapter, now = Date.now()): Promise<{ added: number; skipped: number }> {
  const { templates = [], folders = [] } = await adapter.get(['templates', 'folders']);
  const nextFolders = [...folders];
  const folderByName = new Map(nextFolders.map((f) => [f.name.toLowerCase(), f.id]));
  const nextTemplates = [...templates];
  let added = 0;
  let skipped = 0;
  for (const s of STARTER_TEMPLATES) {
    if (nextTemplates.some((t) => t.starter && t.title === s.title)) {
      skipped++;
      continue;
    }
    let folderId = folderByName.get(s.folder.toLowerCase());
    if (!folderId) {
      folderId = newId('f');
      nextFolders.push({ id: folderId, name: s.folder, createdAt: now });
      folderByName.set(s.folder.toLowerCase(), folderId);
    }
    const shortcutFree = s.shortcut && !nextTemplates.some((t) => t.shortcut === s.shortcut);
    nextTemplates.push({
      id: newId('t'),
      title: s.title,
      description: s.description,
      body: s.body,
      shortcut: shortcutFree ? s.shortcut : null,
      folderId,
      tags: s.tags,
      favorite: false,
      pinned: false,
      createdAt: now,
      updatedAt: now,
      starter: true,
    });
    added++;
  }
  await adapter.set({ templates: nextTemplates, folders: nextFolders });
  return { added, skipped };
}

// ---------- Import / export ----------

export interface LibraryExport {
  format: 'kryz-quick-reply';
  kind: 'library' | 'all-data';
  schemaVersion: number;
  exportedAt: string;
  templates: Template[];
  folders: Folder[];
  trash?: TrashedTemplate[];
  settings?: Settings;
  consent?: StoreShape['consent'];
  usage?: StoreShape['usage'];
}

export async function exportLibrary(adapter: StorageAdapter): Promise<LibraryExport> {
  const all = await loadAll(adapter);
  return { format: 'kryz-quick-reply', kind: 'library', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), templates: all.templates, folders: all.folders };
}

/** Everything the extension stores about the user, for the right of access / portability. */
export async function exportAllData(adapter: StorageAdapter): Promise<LibraryExport> {
  const all = await loadAll(adapter);
  return {
    format: 'kryz-quick-reply',
    kind: 'all-data',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    templates: all.templates,
    folders: all.folders,
    trash: all.trash,
    settings: all.settings,
    consent: all.consent,
    usage: all.usage,
  };
}

export async function applyImport(adapter: StorageAdapter, parsed: ParsedLibrary, mode: 'merge' | 'replace'): Promise<{ added: number; updated: number; shortcutsCleared: number }> {
  const { templates = [], folders = [] } = await adapter.get(['templates', 'folders']);
  if (mode === 'replace') {
    await adapter.set({ templates: parsed.templates.slice(0, LIMITS.maxTemplates), folders: parsed.folders });
    return { added: parsed.templates.length, updated: 0, shortcutsCleared: 0 };
  }
  // Merge: folders by name, templates by id (imported version wins), shortcuts stay unique.
  const nextFolders = [...folders];
  const folderMap = new Map<string, string>();
  for (const f of parsed.folders) {
    const existing = nextFolders.find((x) => x.id === f.id || x.name.toLowerCase() === f.name.toLowerCase());
    if (existing) folderMap.set(f.id, existing.id);
    else {
      nextFolders.push(f);
      folderMap.set(f.id, f.id);
    }
  }
  const next = [...templates];
  let added = 0;
  let updated = 0;
  let shortcutsCleared = 0;
  for (const raw of parsed.templates) {
    const t: Template = { ...raw, folderId: raw.folderId ? folderMap.get(raw.folderId) ?? null : null };
    const idx = next.findIndex((x) => x.id === t.id);
    const others = next.filter((x) => x.id !== t.id);
    if (t.shortcut && others.some((x) => x.shortcut === t.shortcut)) {
      t.shortcut = null;
      shortcutsCleared++;
    }
    if (idx >= 0) {
      next[idx] = t;
      updated++;
    } else {
      if (next.length >= LIMITS.maxTemplates) break;
      next.push(t);
      added++;
    }
  }
  await adapter.set({ templates: next, folders: nextFolders });
  return { added, updated, shortcutsCleared };
}

/** Deletes everything this extension stores in chrome.storage.local. */
export async function deleteAllData(adapter: StorageAdapter): Promise<void> {
  await adapter.clear();
}
