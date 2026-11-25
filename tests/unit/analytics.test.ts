import { describe, expect, it } from 'vitest';
import { dayKey, emptyUsage, estimatedMinutesSaved, pruneUsage, recordUse, summarize } from '../../src/shared/analytics';
import type { Template } from '../../src/shared/types';

const tpl = (id: string, title: string, folderId: string | null = null): Template => ({ id, title, description: '', body: '', shortcut: null, folderId, tags: [], favorite: false, pinned: false, createdAt: 1, updatedAt: 1, starter: false });

describe('analytics', () => {
  it('records uses by template, day and folder', () => {
    const now = new Date(2026, 10, 25, 10);
    let u = recordUse(emptyUsage(), 't_a', 'f_1', 40, now);
    u = recordUse(u, 't_a', 'f_1', 40, now);
    u = recordUse(u, 't_b', null, 20, now);
    expect(u.byTemplate.t_a).toMatchObject({ count: 2, words: 80 });
    expect(u.byDay[dayKey(now)]).toEqual({ count: 3, words: 100 });
    expect(u.byFolder).toEqual({ f_1: 2, none: 1 });
    const s = summarize(u, [tpl('t_a', 'A', 'f_1'), tpl('t_b', 'B')], [{ id: 'f_1', name: 'Sales', createdAt: 1 }], 50, now);
    expect(s.totalUses).toBe(3);
    expect(s.estimatedMinutes).toBeCloseTo(2);
    expect(s.last7Total).toBe(3);
    expect(s.topTemplates[0]).toMatchObject({ title: 'A', count: 2 });
    expect(s.byFolder[0]).toEqual({ name: 'Sales', count: 2 });
  });
  it('clamps typing speed and prunes old days', () => {
    expect(estimatedMinutesSaved(100, 0)).toBeCloseTo(2.5);
    expect(estimatedMinutesSaved(100, 10000)).toBeCloseTo(0.5);
    const u = { ...emptyUsage(), byDay: { '2020-01-01': { count: 1, words: 1 }, [dayKey(new Date())]: { count: 1, words: 1 } } };
    expect(Object.keys(pruneUsage(u).byDay)).toHaveLength(1);
  });
});
