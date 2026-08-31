import { theme } from '../../theme/theme';

interface AlertMessageProps {
  children: React.ReactNode;
  tone?: 'error' | 'info';
}

export function AlertMessage({ children, tone = 'error' }: AlertMessageProps) {
  const classes = tone === 'error' ? theme.alert.error : theme.alert.info;

  return (
    <div
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`${theme.alert.base} ${classes}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
