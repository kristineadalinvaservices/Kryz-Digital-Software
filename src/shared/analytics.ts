/** Local-only usage statistics. Nothing here is ever transmitted. */
import { LIMITS } from './constants';
import type { Folder, Template, Usage } from './types';

export function emptyUsage(): Usage {
  return { byTemplate: {}, byDay: {}, byFolder: {} };
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function recordUse(usage: Usage, templateId: string, folderId: string | null, words: number, now: Date = new Date()): Usage {
  const next: Usage = {
    byTemplate: { ...usage.byTemplate },
    byDay: { ...usage.byDay },
    byFolder: { ...usage.byFolder },
  };
  const t = next.byTemplate[templateId] ?? { count: 0, words: 0, lastUsedAt: 0 };
  next.byTemplate[templateId] = { count: t.count + 1, words: t.words + words, lastUsedAt: now.getTime() };
  const k = dayKey(now);
  const d = next.byDay[k] ?? { count: 0, words: 0 };
  next.byDay[k] = { count: d.count + 1, words: d.words + words };
  const f = folderId ?? 'none';
  next.byFolder[f] = (next.byFolder[f] ?? 0) + 1;
  return pruneUsage(next, now);
}

export function pruneUsage(usage: Usage, now: Date = new Date()): Usage {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - LIMITS.usageRetentionDays);
  const cutoffKey = dayKey(cutoff);
  const byDay: Usage['byDay'] = {};
  for (const [k, v] of Object.entries(usage.byDay)) if (k >= cutoffKey) byDay[k] = v;
  return { ...usage, byDay };
}

/** Estimated minutes saved = words inserted / typing speed. Clearly an estimate. */
export function estimatedMinutesSaved(words: number, wpm: number): number {
  const speed = Math.min(200, Math.max(5, wpm || 40));
  return words / speed;
}

export interface UsageSummary {
  totalUses: number;
  totalWords: number;
  estimatedMinutes: number;
  last7Days: Array<{ day: string; count: number }>;
  last7Total: number;
  last30Total: number;
  topTemplates: Array<{ id: string; title: string; count: number }>;
  byFolder: Array<{ name: string; count: number }>;
}

export function summarize(usage: Usage, templates: Template[], folders: Folder[], wpm: number, now: Date = new Date()): UsageSummary {
  let totalUses = 0;
  let totalWords = 0;
  for (const v of Object.values(usage.byTemplate)) {
    totalUses += v.count;
    totalWords += v.words;
  }
  const last7Days: Array<{ day: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    last7Days.push({ day: k, count: usage.byDay[k]?.count ?? 0 });
  }
  let last30Total = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    last30Total += usage.byDay[dayKey(d)]?.count ?? 0;
  }
  const titles = new Map(templates.map((t) => [t.id, t.title]));
  const topTemplates = Object.entries(usage.byTemplate)
    .map(([id, v]) => ({ id, title: titles.get(id) ?? 'Deleted template', count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const folderNames = new Map(folders.map((f) => [f.id, f.name]));
  const byFolder = Object.entries(usage.byFolder)
    .map(([id, count]) => ({ name: id === 'none' ? 'No folder' : folderNames.get(id) ?? 'Deleted folder', count }))
    .sort((a, b) => b.count - a.count);
  return {
    totalUses,
    totalWords,
    estimatedMinutes: estimatedMinutesSaved(totalWords, wpm),
    last7Days,
    last7Total: last7Days.reduce((s, d) => s + d.count, 0),
    last30Total,
    topTemplates,
    byFolder,
  };
}
