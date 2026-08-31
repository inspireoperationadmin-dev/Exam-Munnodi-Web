import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Layout';
import { WhatsAppLink } from '../../components/ui/WhatsAppLink';
import { theme } from '../../theme/theme';
import type { AccountRestriction } from '../../utils/errors';

interface AccountRestrictionDialogProps {
  email: string;
  restriction: AccountRestriction | null;
  onClose: () => void;
}

export function AccountRestrictionDialog({
  email,
  restriction,
  onClose,
}: AccountRestrictionDialogProps) {
  if (!restriction) return null;

  const title = restriction.type === 'suspended'
    ? 'Account temporarily suspended'
    : 'Account deactivated';
  const supportMessage = [
    'Hi Exam Munnodi, I need help with my student account.',
    `Email: ${email.trim().toLowerCase()}`,
    `Status: ${restriction.message}`,
  ].join('\n');

  return (
    <div
      aria-describedby="account-restriction-message"
      aria-labelledby="account-restriction-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--sf-scrim)] px-4"
      role="dialog"
    >
      <Panel className="w-full max-w-sm shadow-xl">
        <h2 className={theme.text.panelTitle} id="account-restriction-title">
          {title}
        </h2>
        <p className={`mt-2 ${theme.text.body}`} id="account-restriction-message">
          {restriction.message}
        </p>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
          Contact support if you believe this restriction is incorrect.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Close
          </Button>
          <WhatsAppLink
            fullWidth
            label="Get help"
            message={supportMessage}
          />
        </div>
      </Panel>
    </div>
  );
}
