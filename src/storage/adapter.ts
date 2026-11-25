/**
 * Storage abstraction. The MVP uses chrome.storage.local (on this device only).
 * A future cloud-sync adapter can implement the same interface without UI changes.
 */
import type { StoreKey, StoreShape } from '../shared/types';

export type ChangeListener = (changed: Partial<StoreShape>) => void;

export interface StorageAdapter {
  get<K extends StoreKey>(keys: K[]): Promise<Partial<Pick<StoreShape, K>>>;
  set(values: Partial<StoreShape>): Promise<void>;
  remove(keys: StoreKey[]): Promise<void>;
  clear(): Promise<void>;
  /** Bytes used, where the backend can report it. */
  bytesInUse(): Promise<number | null>;
  subscribe(listener: ChangeListener): () => void;
}

export class ChromeLocalAdapter implements StorageAdapter {
  private area = chrome.storage.local;

  async get<K extends StoreKey>(keys: K[]): Promise<Partial<Pick<StoreShape, K>>> {
    return (await this.area.get(keys)) as Partial<Pick<StoreShape, K>>;
  }
  async set(values: Partial<StoreShape>): Promise<void> {
    await this.area.set(values);
  }
  async remove(keys: StoreKey[]): Promise<void> {
    await this.area.remove(keys);
  }
  async clear(): Promise<void> {
    await this.area.clear();
  }
  async bytesInUse(): Promise<number | null> {
    try {
      return await this.area.getBytesInUse(null);
    } catch {
      return null;
    }
  }
  subscribe(listener: ChangeListener): () => void {
    const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local') return;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(changes)) out[k] = v.newValue;
      listener(out as Partial<StoreShape>);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }
}

/** In-memory adapter for unit tests. */
export class MemoryAdapter implements StorageAdapter {
  data: Record<string, unknown> = {};
  private listeners = new Set<ChangeListener>();

  async get<K extends StoreKey>(keys: K[]): Promise<Partial<Pick<StoreShape, K>>> {
    const out: Record<string, unknown> = {};
    for (const k of keys) if (k in this.data) out[k] = structuredClone(this.data[k]);
    return out as Partial<Pick<StoreShape, K>>;
  }
  async set(values: Partial<StoreShape>): Promise<void> {
    for (const [k, v] of Object.entries(values)) this.data[k] = structuredClone(v);
    this.listeners.forEach((l) => l(values));
  }
  async remove(keys: StoreKey[]): Promise<void> {
    for (const k of keys) delete this.data[k];
  }
  async clear(): Promise<void> {
    this.data = {};
  }
  async bytesInUse(): Promise<number | null> {
    return JSON.stringify(this.data).length;
  }
  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

let shared: StorageAdapter | null = null;
export function defaultAdapter(): StorageAdapter {
  if (!shared) shared = new ChromeLocalAdapter();
  return shared;
}
