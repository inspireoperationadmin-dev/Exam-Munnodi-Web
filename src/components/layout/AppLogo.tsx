import { cx } from '../../theme/cx';
import { theme } from '../../theme/theme';

interface AppLogoProps {
  className?: string;
  label?: string;
}

export function AppLogo({ className = '', label = 'Exam Munnodi' }: AppLogoProps) {
  return (
    <div className={cx(theme.brand.logo, className)} aria-label={label}>
      <img
        alt=""
        className={theme.brand.logoMark}
        src="/favicon.png"
      />
      <span className={theme.brand.logoText}>{label}</span>
    </div>
  );
}
