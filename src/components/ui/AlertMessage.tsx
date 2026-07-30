import { theme } from '../../theme/theme';

interface AlertMessageProps {
  children: React.ReactNode;
  tone?: 'error' | 'info';
}

export function AlertMessage({ children, tone = 'error' }: AlertMessageProps) {
  const classes = tone === 'error' ? theme.alert.error : theme.alert.info;

  return (
    <div className={`${theme.alert.base} ${classes}`}>
      {children}
    </div>
  );
}
