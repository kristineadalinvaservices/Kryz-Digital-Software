/** Per-site shortcut access. Each site is an optional host permission the user grants and can revoke. */
import type { StorageAdapter } from '../storage/adapter';
import { loadAll, updateSettings } from '../storage/repository';
import { originToMatchPattern } from '../shared/validation';

/** Must be called from a click handler (Chrome requires a user gesture for permission prompts). */
export async function enableSite(adapter: StorageAdapter, origin: string): Promise<boolean> {
  const granted = await chrome.permissions.request({ origins: [originToMatchPattern(origin)] });
  if (!granted) return false;
  const store = await loadAll(adapter);
  await updateSettings(adapter, {
    expansionEnabled: true,
    expansionSites: [...new Set([...store.settings.expansionSites, origin])],
  });
  return true;
}

/** Turns the site off AND gives the browser permission back. */
export async function disableSite(adapter: StorageAdapter, origin: string): Promise<void> {
  const store = await loadAll(adapter);
  await updateSettings(adapter, { expansionSites: store.settings.expansionSites.filter((o) => o !== origin) });
  try {
    await chrome.permissions.remove({ origins: [originToMatchPattern(origin)] });
  } catch {
    /* already removed */
  }
}

/** Every optional site permission currently granted to the extension. */
export async function grantedSiteOrigins(): Promise<string[]> {
  const all = await chrome.permissions.getAll();
  return (all.origins ?? []).filter((p) => p.endsWith('/*')).map((p) => p.slice(0, -2));
}

export async function revokeAllSites(adapter: StorageAdapter): Promise<void> {
  const origins = await grantedSiteOrigins();
  if (origins.length) {
    try {
      await chrome.permissions.remove({ origins: origins.map(originToMatchPattern) });
    } catch {
      /* some may be required in test builds */
    }
  }
  await updateSettings(adapter, { expansionSites: [] });
}

/** Sites from settings for which Chrome currently grants access (uses Chrome's own pattern matching). */
export async function activeSiteOrigins(sites: string[]): Promise<string[]> {
  const ok = await Promise.all(
    sites.map(async (o) => {
      try {
        return (await chrome.permissions.contains({ origins: [originToMatchPattern(o)] })) ? o : null;
      } catch {
        return null;
      }
    }),
  );
  return ok.filter((o): o is string => o !== null);
}
