import { describe, expect, it } from 'vitest';
import { MemoryAdapter } from '../../src/storage/adapter';
import {
  addStarterTemplates, applyImport, autoPurgeTrash, clearUsage, consentIsCurrent, createFolder, deleteAllData, deleteFolder, deleteFromTrash,
  duplicateTemplate, exportAllData, exportLibrary, loadAll, recordConsent, recordUsage, restoreTemplate, saveTemplate, trashTemplate, updateSettings,
} from '../../src/storage/repository';
import { migrateData, runMigrations } from '../../src/storage/schema';
import { parseLibraryImport } from '../../src/shared/validation';
import { STARTER_TEMPLATES } from '../../src/shared/starterTemplates';

const input = (over: Partial<Parameters<typeof saveTemplate>[1]> = {}) => ({ title: 'Intro', description: '', body: 'Hi {{first_name}}', shortcut: '/intro', folderId: null, tags: ['Sales', ' sales '], ...over });

describe('repository', () => {
  it('creates, edits and validates templates', async () => {
    const a = new MemoryAdapter();
    const t = await saveTemplate(a, input());
    expect(t.id).toMatch(/^t_/);
    expect(t.tags).toEqual(['sales']);
    await expect(saveTemplate(a, input({ title: 'Other' }))).rejects.toThrow(/already used/);
    await expect(saveTemplate(a, input({ title: ' ', shortcut: '' }))).rejects.toThrow(/title/);
    await expect(saveTemplate(a, input({ body: '  ', shortcut: '' }))).rejects.toThrow(/empty/);
    const edited = await saveTemplate(a, input({ title: 'Intro 2' }), t.id, t.createdAt + 5);
    expect(edited.createdAt).toBe(t.createdAt);
    expect((await loadAll(a)).templates).toHaveLength(1);
  });

  it('duplicates without copying the shortcut', async () => {
    const a = new MemoryAdapter();
    const t = await saveTemplate(a, input());
    const c = await duplicateTemplate(a, t.id);
    expect(c.shortcut).toBeNull();
    expect(c.title).toBe('Intro (copy)');
  });

  it('trashes, restores (clearing conflicting shortcut) and purges', async () => {
    const a = new MemoryAdapter();
    const t = await saveTemplate(a, input());
    await trashTemplate(a, t.id, 1000);
    expect((await loadAll(a)).templates).toHaveLength(0);
    await saveTemplate(a, input({ title: 'New intro' }));
    const r = await restoreTemplate(a, t.id);
    expect(r.shortcutCleared).toBe(true);
    await trashTemplate(a, t.id, 0);
    expect(await autoPurgeTrash(a, 31 * 86400000)).toBe(1);
    const t2 = await saveTemplate(a, input({ title: 'X', shortcut: '' }));
    await recordUsage(a, t2.id, 3);
    await trashTemplate(a, t2.id);
    await deleteFromTrash(a, t2.id);
    const s = await loadAll(a);
    expect(s.trash).toHaveLength(0);
    expect(s.usage.byTemplate[t2.id]).toBeUndefined();
  });

  it('manages folders; deleting a folder keeps its templates', async () => {
    const a = new MemoryAdapter();
    const f = await createFolder(a, 'Sales');
    await expect(createFolder(a, 'sales')).rejects.toThrow(/exists/);
    const t = await saveTemplate(a, input({ folderId: f.id }));
    expect(t.folderId).toBe(f.id);
    await deleteFolder(a, f.id);
    const s = await loadAll(a);
    expect(s.folders).toHaveLength(0);
    expect(s.templates[0]!.folderId).toBeNull();
  });

  it('records consent only when both are given, with versions and dates', async () => {
    const a = new MemoryAdapter();
    await expect(recordConsent(a, { privacy: true, terms: false })).rejects.toThrow();
    expect(consentIsCurrent((await loadAll(a)).consent)).toBe(false);
    await recordConsent(a, { privacy: true, terms: true }, 123);
    const c = (await loadAll(a)).consent;
    expect(c.privacyAckAt).toBe(123);
    expect(consentIsCurrent(c)).toBe(true);
  });

  it('adds starter templates once, with unique shortcuts', async () => {
    const a = new MemoryAdapter();
    const r1 = await addStarterTemplates(a);
    expect(r1.added).toBe(STARTER_TEMPLATES.length);
    const r2 = await addStarterTemplates(a);
    expect(r2.added).toBe(0);
    const s = await loadAll(a);
    const shortcuts = s.templates.map((t) => t.shortcut).filter(Boolean);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
    for (const want of ['/intro', '/followup', '/invoice', '/discovery', '/application', '/interview']) expect(shortcuts).toContain(want);
  });

  it('round-trips export → import (merge and replace)', async () => {
    const a = new MemoryAdapter();
    await addStarterTemplates(a);
    const exported = await exportLibrary(a);
    const b = new MemoryAdapter();
    await saveTemplate(b, input()); // conflicting /intro
    const parsed = parseLibraryImport(JSON.stringify(exported));
    const r = await applyImport(b, parsed, 'merge');
    expect(r.added).toBe(STARTER_TEMPLATES.length);
    expect(r.shortcutsCleared).toBe(1);
    const r2 = await applyImport(b, parsed, 'replace');
    expect(r2.added).toBe(STARTER_TEMPLATES.length);
    expect((await loadAll(b)).templates).toHaveLength(STARTER_TEMPLATES.length);
  });

  it('exports all data and deletes everything', async () => {
    const a = new MemoryAdapter();
    await recordConsent(a, { privacy: true, terms: true });
    const t = await saveTemplate(a, input());
    await recordUsage(a, t.id, 5);
    await updateSettings(a, { profile: { senderName: 'Kris', meetingLink: '' } });
    const all = await exportAllData(a);
    expect(all.kind).toBe('all-data');
    expect(all.usage?.byTemplate[t.id]?.count).toBe(1);
    expect(all.settings?.profile.senderName).toBe('Kris');
    await clearUsage(a);
    expect((await loadAll(a)).usage.byTemplate).toEqual({});
    await deleteAllData(a);
    expect(a.data).toEqual({});
    expect(consentIsCurrent((await loadAll(a)).consent)).toBe(false);
  });
});

describe('schema migrations', () => {
  it('migrates from empty and from a v0 shape without losing content', async () => {
    const empty = migrateData({});
    expect(empty).toMatchObject({ from: 0, to: 1 });
    const legacy = migrateData({ templates: [{ id: 't_1' }], settings: { theme: 'signature' } });
    expect((legacy.data.templates as unknown[]).length).toBe(1);
    expect((legacy.data.settings as { theme: string; expandKey: string }).theme).toBe('signature');
    expect((legacy.data.settings as { expandKey: string }).expandKey).toBe('Tab');
  });
  it('never downgrades data written by a newer version', async () => {
    const a = new MemoryAdapter();
    a.data = { meta: { schemaVersion: 99, installedAt: 1 }, templates: ['keep'] };
    await runMigrations(a);
    expect(a.data.templates).toEqual(['keep']);
  });
});
