import { useEffect, useRef, useState } from 'react';
import { Building2, MessageCircle, ReceiptText, X } from 'lucide-react';
import type { SubscriptionPlan } from '../../types/subscription';
import { theme } from '../../theme/theme';

interface SubscriptionActivationSheetProps {
  onClose: () => void;
  open: boolean;
  plan: SubscriptionPlan | null;
  whatsappUrl: string;
}

const steps = [
  {
    icon: Building2,
    title: 'Pay directly to the bank account',
    text: 'Complete the bank payment for the selected subscription period.',
  },
  {
    icon: ReceiptText,
    title: 'Send the receipt through WhatsApp',
    text: 'Include the payment receipt so the admin team can verify it.',
  },
  {
    icon: MessageCircle,
    title: 'Contact us if there is a problem',
    text: 'Use the same WhatsApp chat if you need help with the payment or activation.',
  },
] as const;

export function SubscriptionActivationSheet({
  onClose,
  open,
  plan,
  whatsappUrl,
}: SubscriptionActivationSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }

    if (!rendered) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleDialogKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = [...(sheetRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleDialogKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleDialogKey);
      previousFocus?.focus();
    };
  }, [open]);

  if (!rendered || !plan) return null;

  return (
    <div
      aria-labelledby="subscription-activation-title"
      aria-modal="true"
      className={`fixed inset-0 z-60 flex items-end justify-center bg-[var(--sf-scrim)] sm:items-center sm:p-4 ${closing ? 'sf-sheet-backdrop-exit' : 'sf-sheet-backdrop-enter'}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="dialog"
    >
      <section
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[var(--sf-shadow-lg)] sm:max-w-lg sm:rounded-2xl sm:p-5 ${closing ? 'sf-sheet-exit' : 'sf-sheet-enter'}`}
        ref={sheetRef}
      >
        <div aria-hidden="true" className="mx-auto mb-2 h-1 w-12 rounded-full bg-[var(--sf-border-strong)] sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[var(--sf-brand)]">Manual activation</p>
            <h2 className="mt-1 break-words text-xl font-black leading-7 text-[var(--sf-text)]" id="subscription-activation-title">
              Activate {plan.name}
            </h2>
            <p className="mt-1 text-sm font-bold text-[var(--sf-text-muted)]">{plan.billingCycle} subscription</p>
          </div>
          <button
            aria-label="Close"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <ol className="mt-5 grid gap-3">
          {steps.map(({ icon: Icon, text, title }, index) => (
            <li className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-xl bg-[var(--sf-surface-muted)] p-3" key={title}>
              <span className="relative grid h-11 w-11 place-items-center rounded-lg bg-[var(--sf-surface)] text-[var(--sf-brand)] shadow-[var(--sf-shadow-sm)]">
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--sf-primary)] px-1 text-[10px] font-black text-[var(--sf-primary-text)]">
                  {index + 1}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-5 text-[var(--sf-text)]">{title}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--sf-text-muted)]">{text}</span>
              </span>
            </li>
          ))}
        </ol>

        <a
          className={`${theme.button.base} ${theme.button.sizes.lg} ${theme.button.variants.primary} mt-5 w-full gap-2`}
          href={whatsappUrl}
          rel="noreferrer"
          target="_blank"
        >
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
          Send to WhatsApp
        </a>
      </section>
    </div>
  );
}
