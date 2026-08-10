import { cx } from '../../theme/cx';
import { theme } from '../../theme/theme';

interface AppLogoProps {
  className?: string;
  label?: string;
  variant?: 'dark' | 'light';
}

export function AppLogo({ className = '', label = 'Exam Munnodi', variant = 'dark' }: AppLogoProps) {
  return (
    <div className={cx(theme.brand.logo, className)} aria-label={label}>
      <img
        alt={label}
        className={theme.brand.logoImage}
        src={variant === 'light' ? '/logoDark.svg' : '/logoLight.svg'}
      />
      <span className={theme.brand.logoText}>{label}</span>
    </div>
  );
}
