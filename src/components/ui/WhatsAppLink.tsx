import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { cx } from '../../theme/cx';
import { theme } from '../../theme/theme';

interface WhatsAppLinkProps {
  label: string;
  message: string;
  fullWidth?: boolean;
  className?: string;
}

export function WhatsAppLink({ className = '', label, message, fullWidth = false }: WhatsAppLinkProps) {
  return (
    <a
      className={cx(
        theme.button.base,
        theme.button.variants.secondary,
        fullWidth && 'w-full',
        className,
      )}
      href={buildWhatsAppUrl(message)}
      rel="noreferrer"
      target="_blank"
    >
      <svg aria-hidden="true" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="M4 13a8 8 0 0116 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M5 13h2a1 1 0 011 1v3a1 1 0 01-1 1H6a2 2 0 01-2-2v-2a1 1 0 011-1zM19 13h-2a1 1 0 00-1 1v3a1 1 0 001 1h1a2 2 0 002-2v-2a1 1 0 00-1-1zM13 20h2a3 3 0 003-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
