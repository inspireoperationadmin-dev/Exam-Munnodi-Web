import { useLanguage } from '../../i18n/LanguageContext';
import { useThemeMode, type ThemeMode } from '../../theme/ThemeContext';

const modes: Array<{ mode: Exclude<ThemeMode, 'system'>; labelKey: 'themeLight' | 'themeDark' }> = [
  { mode: 'light', labelKey: 'themeLight' },
  { mode: 'dark', labelKey: 'themeDark' },
];

export function ThemeModeSelector() {
  const { t } = useLanguage();
  const { mode, resolvedMode, setMode } = useThemeMode();

  return (
    <section className="mt-3 rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-3">
      <h2 className="text-sm font-black text-[var(--sf-text)]">{t('appearance')}</h2>

      <div
        aria-label={t('themePreference')}
        className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] p-1"
        role="group"
      >
        {modes.map(({ mode: option, labelKey }) => {
          const selected = mode === option || (mode === 'system' && resolvedMode === option);

          return (
            <button
              aria-pressed={selected}
              className={`min-h-11 min-w-0 rounded-md px-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)] ${
                selected
                  ? 'bg-[var(--sf-primary)] text-[var(--sf-primary-text)] shadow-[var(--sf-shadow-sm)]'
                  : 'text-[var(--sf-text-muted)] hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)]'
              }`}
              key={option}
              onClick={() => setMode(option)}
              type="button"
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
