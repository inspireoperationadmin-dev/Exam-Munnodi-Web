import { theme } from '../../theme/theme';
import { Button } from './Button';
import { Panel } from './Layout';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4"
      role="dialog"
    >
      <Panel className="w-full max-w-sm shadow-xl">
        <h2 className={theme.text.panelTitle}>{title}</h2>
        <p className={`mt-2 ${theme.text.body}`}>{message}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            type="button"
            variant={danger ? 'danger' : 'primary'}
          >
            {confirmLabel}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
