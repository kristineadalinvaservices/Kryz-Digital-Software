/**
 * Storage schema defaults and versioned migrations.
 * Migrations are pure functions from version N to N+1 and run in the background
 * service worker on install/update. They never delete user content.
 */
import { SCHEMA_VERSION } from '../shared/constants';
import { emptyUsage } from '../shared/analytics';
import type { Consent, Settings, StoreShape } from '../shared/types';
import type { StorageAdapter } from './adapter';

export const ALL_KEYS: Array<keyof StoreShape> = ['meta', 'templates', 'folders', 'trash', 'settings', 'consent', 'usage'];

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    motion: 'system',
    expansionEnabled: false,
    expandKey: 'Tab',
    expansionSites: [],
    typingWpm: 40,
    profile: { senderName: '', meetingLink: '' },
  };
}

export function defaultConsent(): Consent {
  return {
    privacyAckVersion: null,
    privacyAckAt: null,
    termsAcceptedVersion: null,
    termsAcceptedAt: null,
    onboardingCompletedAt: null,
  };
}

export function defaultStore(now = Date.now()): StoreShape {
  return {
    meta: { schemaVersion: SCHEMA_VERSION, installedAt: now },
    templates: [],
    folders: [],
    trash: [],
    settings: defaultSettings(),
    consent: defaultConsent(),
    usage: emptyUsage(),
  };
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * MIGRATIONS[n] upgrades from version n to n+1.
 * Version 0 means "nothing stored yet / pre-release".
 */
const MIGRATIONS: Record<number, Migration> = {
  0: (data) => {
    const d = defaultStore();
    return {
      ...d,
      ...data,
      settings: { ...d.settings, ...((data.settings as object) ?? {}) },
      consent: { ...d.consent, ...((data.consent as object) ?? {}) },
      meta: { schemaVersion: 1, installedAt: (data.meta as { installedAt?: number } | undefined)?.installedAt ?? d.meta.installedAt },
    };
  },
};

export function migrateData(data: Record<string, unknown>): { data: Record<string, unknown>; from: number; to: number } {
  const meta = data.meta as { schemaVersion?: number } | undefined;
  const from = typeof meta?.schemaVersion === 'number' ? meta.schemaVersion : 0;
  let current = data;
  let v = from;
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Missing migration from schema ${v}`);
    current = step(current);
    v++;
  }
  // Fill any missing keys added later without overwriting existing content.
  const d = defaultStore();
  for (const k of ALL_KEYS) if (current[k] === undefined) current[k] = d[k];
  current.settings = { ...d.settings, ...(current.settings as object) };
  return { data: current, from, to: v };
}

export async function runMigrations(adapter: StorageAdapter): Promise<{ from: number; to: number }> {
  const raw = (await adapter.get(ALL_KEYS)) as Record<string, unknown>;
  const meta = raw.meta as { schemaVersion?: number } | undefined;
  if (meta?.schemaVersion !== undefined && meta.schemaVersion > SCHEMA_VERSION) {
    // Downgrade: leave data untouched rather than risk loss.
    return { from: meta.schemaVersion, to: meta.schemaVersion };
  }
  const { data, from, to } = migrateData(raw);
  await adapter.set(data as Partial<StoreShape>);
  return { from, to };
}
