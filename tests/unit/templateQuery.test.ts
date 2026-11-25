import { describe, expect, it } from 'vitest';
import { filterTemplates, sortTemplates } from '../../src/ui/templateQuery';
import { emptyUsage } from '../../src/shared/analytics';
import type { Template } from '../../src/shared/types';

const mk = (id: string, o: Partial<Template>): Template => ({ id, title: id, description: '', body: '', shortcut: null, folderId: null, tags: [], favorite: false, pinned: false, createdAt: 1, updatedAt: 1, starter: false, ...o });
const list = [
  mk('a', { title: 'Invoice reminder', body: 'Pay {{amount}}', tags: ['billing'], folderId: 'f1', createdAt: 3, updatedAt: 1 }),
  mk('b', { title: 'Intro', shortcut: '/intro', favorite: true, createdAt: 1, updatedAt: 3 }),
  mk('c', { title: 'Zed', pinned: true, createdAt: 2, updatedAt: 2 }),
];

describe('template search, filter and sort', () => {
  it('searches title, body, tags and shortcut (all terms)', () => {
    expect(filterTemplates(list, { query: 'pay' }).map((t) => t.id)).toEqual(['a']);
    expect(filterTemplates(list, { query: '/intro' }).map((t) => t.id)).toEqual(['b']);
    expect(filterTemplates(list, { query: 'billing invoice' }).map((t) => t.id)).toEqual(['a']);
    expect(filterTemplates(list, { query: 'billing intro' })).toHaveLength(0);
  });
  it('filters by folder, favorites, pinned and tag', () => {
    expect(filterTemplates(list, { folderId: 'f1' }).map((t) => t.id)).toEqual(['a']);
    expect(filterTemplates(list, { folderId: 'none' })).toHaveLength(2);
    expect(filterTemplates(list, { favoritesOnly: true }).map((t) => t.id)).toEqual(['b']);
    expect(filterTemplates(list, { pinnedOnly: true }).map((t) => t.id)).toEqual(['c']);
    expect(filterTemplates(list, { tag: 'billing' }).map((t) => t.id)).toEqual(['a']);
  });
  it('sorts by name, dates, usage and smart order', () => {
    const u = { ...emptyUsage(), byTemplate: { a: { count: 5, words: 1, lastUsedAt: 1 } } };
    expect(sortTemplates(list, 'name', u).map((t) => t.id)).toEqual(['b', 'a', 'c']);
    expect(sortTemplates(list, 'created', u).map((t) => t.id)).toEqual(['a', 'c', 'b']);
    expect(sortTemplates(list, 'updated', u).map((t) => t.id)).toEqual(['b', 'c', 'a']);
    expect(sortTemplates(list, 'usage', u)[0]!.id).toBe('a');
    expect(sortTemplates(list, 'smart', u).map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });
});
