import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';

const themeModeStorageKey = 'exam_munnodi_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(themeModeStorageKey);
    return stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system';
  } catch {
    return 'system';
  }
}

function getSystemThemeMode(): ResolvedThemeMode {
  if (!window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveThemeMode(mode: ThemeMode): ResolvedThemeMode {
  return mode === 'system' ? getSystemThemeMode() : mode;
}

function applyThemeMode(mode: ThemeMode, resolvedMode: ResolvedThemeMode) {
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolvedMode;

  const themeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--sf-theme-color')
    .trim();
  if (themeColor) {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColor);
  }

  document
    .querySelector<HTMLLinkElement>('#app-favicon')
    ?.setAttribute('href', resolvedMode === 'dark' ? '/EM_DARK.png' : '/EM_Logo.png');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [resolvedMode, setResolvedMode] = useState<ResolvedThemeMode>(() => resolveThemeMode(getStoredThemeMode()));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function updateResolvedMode() {
      const nextResolvedMode = resolveThemeMode(mode);
      setResolvedMode(nextResolvedMode);
      applyThemeMode(mode, nextResolvedMode);
    }

    updateResolvedMode();
    media.addEventListener?.('change', updateResolvedMode);

    return () => media.removeEventListener?.('change', updateResolvedMode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    resolvedMode,
    setMode: (nextMode) => {
      setModeState(nextMode);
      try {
        localStorage.setItem(themeModeStorageKey, nextMode);
      } catch {
        // Theme still works for this session if storage is unavailable.
      }
    },
  }), [mode, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used inside ThemeProvider');
  return context;
}
