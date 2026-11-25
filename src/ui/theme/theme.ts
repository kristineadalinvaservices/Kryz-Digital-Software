import type { MotionPreference, ThemePreference } from '../../shared/types';

const THEME_KEY = 'kqr-theme';
const MOTION_KEY = 'kqr-motion';

export function resolveTheme(pref: ThemePreference): 'light' | 'signature' {
  if (pref === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'signature' : 'light';
  return pref;
}

/** Apply instantly and mirror to localStorage so theme-boot.js can apply it before paint next time. */
export function applyTheme(pref: ThemePreference, motion: MotionPreference): void {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(pref);
  root.dataset.motion = motion;
  try {
    // Defaults need no mirror (theme-boot.js falls back to "system"), so nothing lingers after "Delete all".
    if (pref === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
    if (motion === 'system') localStorage.removeItem(MOTION_KEY);
    else localStorage.setItem(MOTION_KEY, motion);
  } catch {
    /* storage unavailable; theme still applied for this session */
  }
}

export function clearThemeMirror(): void {
  try {
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(MOTION_KEY);
  } catch {
    /* ignore */
  }
}

/** Follow OS changes while the preference is "system". Returns an unsubscribe function. */
export function watchSystemTheme(getPref: () => ThemePreference, getMotion: () => MotionPreference): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getPref() === 'system') applyTheme('system', getMotion());
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
