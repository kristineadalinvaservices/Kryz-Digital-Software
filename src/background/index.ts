/**
 * Background service worker.
 * Responsibilities:
 *  - run storage migrations and trash clean-up
 *  - open first-time onboarding
 *  - register the shortcut expander ONLY on sites the user enabled AND granted
 *  - answer validated requests from the expander content script
 * It makes no network requests.
 */
import { defaultAdapter } from '../storage/adapter';
import { runMigrations } from '../storage/schema';
import { autoPurgeTrash, consentIsCurrent, loadAll, recordUsage, updateSettings } from '../storage/repository';
import { parseContentRequest, type GetShortcutsResponse, type ResolveShortcutResponse } from '../shared/messages';
import { originToMatchPattern } from '../shared/validation';

const adapter = defaultAdapter();
const SCRIPT_ID = 'kqr-expander';

/** Uses Chrome's own matching, so broader grants (or test-build host permissions) are honoured correctly. */
async function isGranted(origin: string): Promise<boolean> {
  try {
    return await chrome.permissions.contains({ origins: [originToMatchPattern(origin)] });
  } catch {
    return false;
  }
}

/** Origins where expansion is currently allowed: enabled in settings, permission granted, consent current. */
async function activeOrigins(): Promise<string[]> {
  const store = await loadAll(adapter);
  if (!store.settings.expansionEnabled || !consentIsCurrent(store.consent)) return [];
  const checks = await Promise.all(store.settings.expansionSites.map(async (o) => ((await isGranted(o)) ? o : null)));
  return checks.filter((o): o is string => o !== null);
}

export async function syncContentScripts(): Promise<void> {
  const origins = await activeOrigins();
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (!origins.length) {
    if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    return;
  }
  const script: chrome.scripting.RegisteredContentScript = {
    id: SCRIPT_ID,
    js: ['content.js'],
    matches: origins.map(originToMatchPattern),
    runAt: 'document_idle',
    allFrames: false,
    persistAcrossSessions: true,
  };
  const before = new Set(existing[0]?.matches ?? []);
  if (existing.length) await chrome.scripting.updateContentScripts([script]);
  else await chrome.scripting.registerContentScripts([script]);
  // Make newly approved sites work in tabs that are already open (no reload needed).
  const added = (script.matches ?? []).filter((m) => !before.has(m));
  if (added.length) {
    const tabs = await chrome.tabs.query({ url: added });
    await Promise.all(
      tabs.map((t) => (t.id ? chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['content.js'] }).catch(() => undefined) : undefined)),
    );
  }
}

async function housekeeping(): Promise<void> {
  await runMigrations(adapter);
  await autoPurgeTrash(adapter);
  await syncContentScripts();
}

chrome.runtime.onInstalled.addListener((details) => {
  void (async () => {
    await housekeeping();
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
      await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#/welcome') });
    }
  })();
});

chrome.runtime.onStartup.addListener(() => {
  void housekeeping();
});

chrome.permissions.onRemoved.addListener((removed) => {
  void (async () => {
    // A revoked site is also switched off in settings so the UI reflects reality.
    const revoked = new Set((removed.origins ?? []).map((p) => p.replace(/\/\*$/, '')));
    if (revoked.size) {
      const store = await loadAll(adapter);
      await updateSettings(adapter, { expansionSites: store.settings.expansionSites.filter((o) => !revoked.has(o)) });
    }
    await syncContentScripts();
  })();
});

chrome.permissions.onAdded.addListener(() => {
  void syncContentScripts();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.settings || changes.consent)) void syncContentScripts();
});

/** Content-script requests are accepted only from our own content script, in a top frame, on an active origin. */
async function senderOrigin(sender: chrome.runtime.MessageSender): Promise<string | null> {
  if (sender.id !== chrome.runtime.id) return null;
  if (!sender.tab || sender.frameId !== 0) return null;
  const origin = sender.origin ?? (sender.url ? new URL(sender.url).origin : null);
  if (!origin) return null;
  const active = await activeOrigins();
  return active.includes(origin) ? origin : null;
}

chrome.runtime.onMessage.addListener((raw, sender, sendResponse) => {
  // Extension pages talk to storage directly; this channel is only for the content script.
  const isExtensionPage = sender.url?.startsWith(chrome.runtime.getURL('')) ?? false;
  if (isExtensionPage) return false;
  const msg = parseContentRequest(raw);
  if (!msg) return false;

  void (async () => {
    const origin = await senderOrigin(sender);
    if (msg.type === 'kqr/getShortcuts') {
      if (!origin) return sendResponse({ enabled: false, expandKey: 'Tab', shortcuts: [] } satisfies GetShortcutsResponse);
      const store = await loadAll(adapter);
      const shortcuts = store.templates.filter((t) => t.shortcut).map((t) => ({ shortcut: t.shortcut as string, title: t.title }));
      return sendResponse({ enabled: true, expandKey: store.settings.expandKey, shortcuts } satisfies GetShortcutsResponse);
    }
    if (!origin) return sendResponse({ found: false } satisfies ResolveShortcutResponse);
    if (msg.type === 'kqr/resolveShortcut') {
      const store = await loadAll(adapter);
      const t = store.templates.find((x) => x.shortcut === msg.shortcut);
      if (!t) return sendResponse({ found: false } satisfies ResolveShortcutResponse);
      return sendResponse({
        found: true,
        templateId: t.id,
        title: t.title,
        body: t.body,
        senderName: store.settings.profile.senderName,
        meetingLink: store.settings.profile.meetingLink,
      } satisfies ResolveShortcutResponse);
    }
    if (msg.type === 'kqr/recordUse') {
      await recordUsage(adapter, msg.templateId, msg.words);
      return sendResponse({ ok: true });
    }
  })();
  return true; // async response
});
