import { useThemeMode } from '../../theme/ThemeContext';

interface ThemeAppIconProps {
  alt: string;
  className?: string;
}

export function ThemeAppIcon({ alt, className = '' }: ThemeAppIconProps) {
  const { resolvedMode } = useThemeMode();

  return (
    <img
      alt={alt}
      className={className}
      src={resolvedMode === 'dark' ? '/EM_DARK.png' : '/EM_Logo.png'}
    />
  );
}
