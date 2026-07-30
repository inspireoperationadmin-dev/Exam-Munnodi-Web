import { Link } from 'react-router-dom';
import { cx } from '../../theme/cx';
import { theme, type ThemeButtonSize, type ThemeButtonVariant } from '../../theme/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ThemeButtonVariant;
  size?: ThemeButtonSize;
  fullWidth?: boolean;
}

interface ButtonLinkProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  size?: ThemeButtonSize;
  to: string;
  variant?: ThemeButtonVariant;
}

function buttonClassName(variant: ThemeButtonVariant, size: ThemeButtonSize, fullWidth: boolean, className = '') {
  return cx(theme.button.base, theme.button.sizes[size], theme.button.variants[variant], fullWidth && 'w-full', className);
}

export function Button({ className = '', fullWidth = false, size = 'md', variant = 'primary', ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, size, fullWidth, className)} {...props} />;
}

export function ButtonLink({ children, className = '', fullWidth = false, size = 'md', to, variant = 'secondary' }: ButtonLinkProps) {
  return (
    <Link className={buttonClassName(variant, size, fullWidth, className)} to={to}>
      {children}
    </Link>
  );
}
