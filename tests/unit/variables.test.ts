import { describe, expect, it } from 'vitest';
import { defaultValues, extractVariables, missingVariables, renderTemplate, tokenize, wordCount } from '../../src/shared/variables';

describe('variables', () => {
  const body = 'Hi {{first_name}}, about {{ company }} and {{first_name}} again. {{project_name}} {{date}}';

  it('extracts unique variables in order with labels', () => {
    const v = extractVariables(body);
    expect(v.map((x) => x.key)).toEqual(['first_name', 'company', 'project_name', 'date']);
    expect(v[0]!.label).toBe('First name');
    expect(v[2]).toMatchObject({ source: 'custom', label: 'Project name' });
  });

  it('never invents recipient details; only sender/date defaults', () => {
    const v = extractVariables('{{first_name}} {{company}} {{sender_name}} {{meeting_link}} {{date}}');
    const d = defaultValues(v, { senderName: 'Kris', meetingLink: 'https://cal.example/x', now: new Date(2026, 10, 25) });
    expect(d.first_name).toBe('');
    expect(d.company).toBe('');
    expect(d.sender_name).toBe('Kris');
    expect(d.meeting_link).toBe('https://cal.example/x');
    expect(d.date).toMatch(/2026/);
  });

  it('renders values and leaves missing ones as tokens', () => {
    expect(renderTemplate('Hi {{first_name}} at {{company}}', { first_name: 'Ana' })).toBe('Hi Ana at {{company}}');
    expect(renderTemplate('Hi {{FIRST_NAME}}', { first_name: 'Ana' })).toBe('Hi Ana');
  });

  it('treats values as plain text (no HTML/expression evaluation)', () => {
    const evil = '<img src=x onerror=alert(1)>{{company}}${1+1}';
    expect(renderTemplate('{{first_name}}', { first_name: evil })).toBe(evil);
  });

  it('does not use inherited properties as values', () => {
    expect(renderTemplate('{{constructor}}', {})).toBe('{{constructor}}');
  });

  it('reports missing variables', () => {
    const v = extractVariables('{{first_name}} {{company}}');
    expect(missingVariables(v, { first_name: ' ', company: 'X' }).map((m) => m.key)).toEqual(['first_name']);
  });

  it('tokenizes for preview', () => {
    const parts = tokenize('Hi {{first_name}}!', { first_name: 'Ana' });
    expect(parts).toEqual([{ text: 'Hi ' }, { text: 'Ana', variable: 'first_name', filled: true }, { text: '!' }]);
  });

  it('counts words', () => {
    expect(wordCount('  one two\nthree ')).toBe(3);
    expect(wordCount('')).toBe(0);
  });
});
