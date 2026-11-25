/** Actions on the active browser tab, used by the popup. Requires the user to have clicked the toolbar icon (activeTab). */
import { insertIntoFocusedField, type InsertResult } from '../background/injectInsert';
import { siteOriginFromUrl } from '../shared/validation';

export async function activeTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

export async function insertIntoActiveTab(text: string): Promise<InsertResult> {
  const tab = await activeTab();
  if (!tab?.id || !siteOriginFromUrl(tab.url)) {
    return { ok: false, reason: 'Inserting is not available on this page. Use Copy instead.' };
  }
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: insertIntoFocusedField, args: [text] });
    return (res?.result as InsertResult | undefined) ?? { ok: false, reason: 'The page did not respond. Use Copy instead.' };
  } catch {
    return { ok: false, reason: 'Inserting is not available on this page. Use Copy instead.' };
  }
}

export async function hasOriginPermission(origin: string): Promise<boolean> {
  try {
    return await chrome.permissions.contains({ origins: [`${origin}/*`] });
  } catch {
    return false;
  }
}
