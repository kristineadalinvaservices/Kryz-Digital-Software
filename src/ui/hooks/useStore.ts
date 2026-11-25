import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultAdapter, type StorageAdapter } from '../../storage/adapter';
import { loadAll } from '../../storage/repository';
import type { StoreShape } from '../../shared/types';
import { applyTheme, watchSystemTheme } from '../theme/theme';

/** Loads the whole local store, keeps it live across popup/dashboard, and applies the theme. */
export function useStore(): { store: StoreShape | null; error: string | null; adapter: StorageAdapter; reload: () => void } {
  const adapter = defaultAdapter();
  const [store, setStore] = useState<StoreShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storeRef = useRef<StoreShape | null>(null);

  const reload = useCallback(() => {
    loadAll(adapter)
      .then((s) => {
        storeRef.current = s;
        setStore(s);
        setError(null);
        applyTheme(s.settings.theme, s.settings.motion);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not read local data.'));
  }, [adapter]);

  useEffect(() => {
    reload();
    const unsub = adapter.subscribe(() => reload());
    const unwatch = watchSystemTheme(
      () => storeRef.current?.settings.theme ?? 'system',
      () => storeRef.current?.settings.motion ?? 'system',
    );
    return () => {
      unsub();
      unwatch();
    };
  }, [adapter, reload]);

  return { store, error, adapter, reload };
}
