import { theme } from '../../theme/theme';
import { Button } from './Button';
import { Panel } from './Layout';

interface InfoDialogProps {
  open: boolean;
  title: string;
  message: string;
  closeLabel: string;
  onClose: () => void;
}

export function InfoDialog({ open, title, message, closeLabel, onClose }: InfoDialogProps) {
  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--sf-scrim)] px-4"
      role="dialog"
    >
      <Panel className="w-full max-w-sm shadow-xl">
        <h2 className={theme.text.panelTitle}>{title}</h2>
        <p className={`mt-2 ${theme.text.body}`}>{message}</p>

        <div className="mt-5 flex justify-end">
          <Button onClick={onClose} type="button">
            {closeLabel}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
