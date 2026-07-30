import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { theme } from '../../theme/theme';

interface WhatsAppLinkProps {
  label: string;
  message: string;
  fullWidth?: boolean;
}

export function WhatsAppLink({ label, message, fullWidth = false }: WhatsAppLinkProps) {
  return (
    <a
      className={[
        theme.button.base,
        theme.button.variants.secondary,
        fullWidth ? 'w-full' : '',
      ].join(' ')}
      href={buildWhatsAppUrl(message)}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}
