/**
 * Dynamic variables use double braces: {{first_name}}, {{company}}, {{project_name}}.
 * Rendering is plain string substitution. No expressions are evaluated, ever.
 */
import { LIMITS } from './constants';

export const VARIABLE_PATTERN = /\{\{\s*([a-z][a-z0-9_]{0,39})\s*\}\}/gi;

export interface VariableDef {
  key: string;
  label: string;
  /** Where a default may come from. Recipient fields never have a default. */
  source: 'recipient' | 'sender' | 'date' | 'custom';
  placeholder?: string;
}

export const BUILT_IN_VARIABLES: VariableDef[] = [
  { key: 'first_name', label: 'First name', source: 'recipient' },
  { key: 'last_name', label: 'Last name', source: 'recipient' },
  { key: 'company', label: 'Company', source: 'recipient' },
  { key: 'job_title', label: 'Job title', source: 'recipient' },
  { key: 'sender_name', label: 'Sender name', source: 'sender' },
  { key: 'meeting_link', label: 'Meeting link', source: 'sender', placeholder: 'https://' },
  { key: 'invoice_number', label: 'Invoice number', source: 'recipient' },
  { key: 'amount', label: 'Amount', source: 'recipient', placeholder: 'e.g. USD 500' },
  { key: 'date', label: 'Date', source: 'date' },
];

const BUILT_IN_BY_KEY = new Map(BUILT_IN_VARIABLES.map((v) => [v.key, v]));

function humanize(key: string): string {
  const words = key.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Unique variables in order of first appearance. */
export function extractVariables(body: string): VariableDef[] {
  const seen = new Set<string>();
  const out: VariableDef[] = [];
  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    const key = (match[1] ?? '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(BUILT_IN_BY_KEY.get(key) ?? { key, label: humanize(key), source: 'custom' });
  }
  return out;
}

export interface DefaultSources {
  senderName?: string;
  meetingLink?: string;
  now?: Date;
}

/**
 * Suggested starting values. Only the user's own saved details and today's date.
 * Recipient details are always left empty: we never invent them.
 */
export function defaultValues(vars: VariableDef[], src: DefaultSources): Record<string, string> {
  const values: Record<string, string> = {};
  for (const v of vars) {
    if (v.key === 'sender_name' && src.senderName) values[v.key] = src.senderName;
    else if (v.key === 'meeting_link' && src.meetingLink) values[v.key] = src.meetingLink;
    else if (v.key === 'date') values[v.key] = formatDate(src.now ?? new Date());
    else values[v.key] = '';
  }
  return values;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function missingVariables(vars: VariableDef[], values: Record<string, string>): VariableDef[] {
  return vars.filter((v) => !(values[v.key] ?? '').trim());
}

/** Replace variables with values. Unknown/missing values are left as the original token. */
export function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(VARIABLE_PATTERN, (token, rawKey: string) => {
    const key = rawKey.toLowerCase();
    const value = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : undefined;
    if (value === undefined || value.trim() === '') return token;
    return value.slice(0, LIMITS.variableValueChars);
  });
}

/** Split a body into text and variable parts, for highlighted previews (rendered as text nodes). */
export function tokenize(body: string, values: Record<string, string> = {}): Array<{ text: string; variable?: string; filled?: boolean }> {
  const parts: Array<{ text: string; variable?: string; filled?: boolean }> = [];
  let last = 0;
  for (const m of body.matchAll(VARIABLE_PATTERN)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ text: body.slice(last, idx) });
    const key = (m[1] ?? '').toLowerCase();
    const val = values[key]?.trim();
    parts.push({ text: val ? val : m[0], variable: key, filled: Boolean(val) });
    last = idx + m[0].length;
  }
  if (last < body.length) parts.push({ text: body.slice(last) });
  return parts;
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
