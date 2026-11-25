import { describe, expect, it } from 'vitest';
import { parseContentRequest } from '../../src/shared/messages';

describe('runtime message validation', () => {
  it('accepts only well-formed requests', () => {
    expect(parseContentRequest({ type: 'kqr/getShortcuts' })).toEqual({ type: 'kqr/getShortcuts' });
    expect(parseContentRequest({ type: 'kqr/resolveShortcut', shortcut: '/intro' })).toMatchObject({ shortcut: '/intro' });
    expect(parseContentRequest({ type: 'kqr/recordUse', templateId: 't_0123456789ab', words: 12 })).toMatchObject({ words: 12 });
  });
  it('rejects unknown types, bad payloads and non-objects', () => {
    for (const bad of [
      null, 'kqr/getShortcuts', [], { type: 'kqr/deleteAll' }, { type: 'kqr/resolveShortcut', shortcut: 'intro' },
      { type: 'kqr/resolveShortcut', shortcut: '/a b' }, { type: 'kqr/recordUse', templateId: '../x', words: 1 },
      { type: 'kqr/recordUse', templateId: 't_0123456789ab', words: -1 }, { type: 'kqr/recordUse', templateId: 't_0123456789ab', words: 1.5 },
    ]) expect(parseContentRequest(bad)).toBeNull();
  });
  it('drops extra fields', () => {
    expect(parseContentRequest({ type: 'kqr/getShortcuts', evil: 1 })).toEqual({ type: 'kqr/getShortcuts' });
  });
});
