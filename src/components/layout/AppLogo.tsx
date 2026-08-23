import { cx } from '../../theme/cx';
import { theme } from '../../theme/theme';
import { useThemeMode } from '../../theme/ThemeContext';

interface AppLogoProps {
  className?: string;
  label?: string;
}

export function AppLogo({ className = '', label = 'Exam Munnodi' }: AppLogoProps) {
  const { resolvedMode } = useThemeMode();

  return (
    <div className={cx(theme.brand.logo, className)} aria-label={label}>
      <img
        alt={label}
        className={theme.brand.logoImage}
        src={resolvedMode === 'dark' ? '/DarkModeEM.svg' : '/LightModeEM.svg'}
      />
      <span className={theme.brand.logoText}>{label}</span>
    </div>
  );
}
