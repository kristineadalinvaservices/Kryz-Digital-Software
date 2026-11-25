import { describe, expect, it } from 'vitest';
import { cleanText, isSafeHttpUrl, parseLibraryImport, safeJsonParse, siteOriginFromUrl } from '../../src/shared/validation';

const file = (obj: unknown) => JSON.stringify(obj);
const base = { format: 'kryz-quick-reply', schemaVersion: 1 };

describe('import validation', () => {
  it('rejects non-JSON, wrong format and oversized files', () => {
    expect(parseLibraryImport('not json').issues[0]!.level).toBe('error');
    expect(parseLibraryImport(file({ format: 'other' })).issues[0]!.message).toMatch(/not a Kryz/);
    const big = file({ ...base, templates: [{ title: 'a', body: 'x'.repeat(2.1 * 1024 * 1024) }] });
    expect(parseLibraryImport(big).issues[0]!.message).toMatch(/2 MB/);
  });

  it('blocks prototype pollution', () => {
    const text = '{"format":"kryz-quick-reply","schemaVersion":1,"__proto__":{"polluted":true},"templates":[{"title":"a","body":"b","constructor":{"prototype":{"polluted":true}}}]}';
    const r = parseLibraryImport(text);
    expect(r.templates).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(safeJsonParse('{"__proto__":{"x":1}}'), '__proto__')).toBe(false);
  });

  it('keeps HTML/script as inert text and strips control characters', () => {
    const r = parseLibraryImport(file({ ...base, templates: [{ title: '<script>alert(1)</script>', body: 'Hi\u0000<img onerror=x>' }] }));
    expect(r.templates[0]!.title).toBe('<script>alert(1)</script>');
    expect(r.templates[0]!.body).toBe('Hi<img onerror=x>');
  });

  it('drops unknown fields, fixes ids, de-duplicates shortcuts and unknown folders', () => {
    const r = parseLibraryImport(
      file({
        ...base,
        folders: [{ id: 'f_0123456789ab', name: 'Sales' }, { id: 'evil', name: '' }],
        templates: [
          { id: 't_0123456789ab', title: 'A', body: 'a', shortcut: '/a', folderId: 'f_0123456789ab', extra: 'x', favorite: 'yes' },
          { id: 't_0123456789ab', title: 'B', body: 'b', shortcut: '/A', folderId: 'f_missing' },
          { id: 'javascript:alert(1)', title: 'C', body: 'c', shortcut: '/bad shortcut', tags: ['X', 'x', 5] },
          { title: '', body: 'no title' },
        ],
      }),
    );
    expect(r.folders).toHaveLength(1);
    expect(r.templates).toHaveLength(3);
    const [a, b, c] = r.templates;
    expect(a).not.toHaveProperty('extra');
    expect(a!.favorite).toBe(false);
    expect(b!.id).not.toBe(a!.id);
    expect(b!.shortcut).toBeNull();
    expect(b!.folderId).toBeNull();
    expect(c!.id).toMatch(/^t_[a-f0-9]+$/);
    expect(c!.shortcut).toBeNull();
    expect(c!.tags).toEqual(['x']);
    expect(r.issues.some((i) => /skipped/.test(i.message))).toBe(true);
  });

  it('cleans text and limits length', () => {
    expect(cleanText('a\u0007b\tc\n', 10)).toBe('ab\tc\n');
    expect(cleanText(42, 10)).toBe('');
    expect(cleanText('x'.repeat(50), 5)).toBe('xxxxx');
  });

  it('accepts only http(s) URLs and normal web origins', () => {
    expect(isSafeHttpUrl('https://meet.example.com/x')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,hi')).toBe(false);
    expect(siteOriginFromUrl('https://mail.google.com/mail/u/0/#inbox')).toBe('https://mail.google.com');
    expect(siteOriginFromUrl('chrome://extensions')).toBeNull();
    expect(siteOriginFromUrl('https://chromewebstore.google.com/detail/x')).toBeNull();
    expect(siteOriginFromUrl('file:///etc/passwd')).toBeNull();
  });
});
