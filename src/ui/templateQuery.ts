/** Search, filter and sort for templates. Pure functions, unit tested. */
import type { Template, Usage } from '../shared/types';

export interface TemplateFilter {
  query?: string;
  folderId?: string | null | 'all' | 'none';
  favoritesOnly?: boolean;
  pinnedOnly?: boolean;
  tag?: string | null;
}

export function filterTemplates(templates: Template[], f: TemplateFilter): Template[] {
  const terms = (f.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return templates.filter((t) => {
    if (f.favoritesOnly && !t.favorite) return false;
    if (f.pinnedOnly && !t.pinned) return false;
    if (f.folderId === 'none' && t.folderId !== null) return false;
    if (f.folderId && f.folderId !== 'all' && f.folderId !== 'none' && t.folderId !== f.folderId) return false;
    if (f.tag && !t.tags.includes(f.tag)) return false;
    if (!terms.length) return true;
    const hay = `${t.title}\n${t.description}\n${t.body}\n${t.shortcut ?? ''}\n${t.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => hay.includes(term));
  });
}

export type SortKey = 'smart' | 'name' | 'updated' | 'created' | 'usage';

export function sortTemplates(templates: Template[], key: SortKey, usage: Usage): Template[] {
  const count = (t: Template) => usage.byTemplate[t.id]?.count ?? 0;
  const list = [...templates];
  switch (key) {
    case 'name':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'updated':
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    case 'created':
      return list.sort((a, b) => b.createdAt - a.createdAt);
    case 'usage':
      return list.sort((a, b) => count(b) - count(a) || a.title.localeCompare(b.title));
    case 'smart':
    default:
      return list.sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          Number(b.favorite) - Number(a.favorite) ||
          count(b) - count(a) ||
          a.title.localeCompare(b.title),
      );
  }
}
