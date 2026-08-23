import { CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscription } from './SubscriptionContext';

export function SubscriptionUpdateNotice() {
  const { dismissUpdateNotice, updateNotice } = useSubscription();
  if (!updateNotice) return null;

  return (
    <aside
      className="fixed inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto grid max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-[var(--sf-selected-border)] bg-[var(--sf-surface)] p-3 shadow-[var(--sf-shadow-lg)]"
      role="status"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--sf-success-soft)] text-[var(--sf-success-text)]">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0 py-0.5">
        <p className="text-sm font-black text-[var(--sf-text)]">Subscription updated</p>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-[var(--sf-text-muted)]">{updateNotice}</p>
        <Link className="mt-1 inline-block text-xs font-black text-[var(--sf-brand)]" onClick={dismissUpdateNotice} to="/subscription">
          View subscription
        </Link>
      </div>
      <button
        aria-label="Dismiss subscription update"
        className="grid h-9 w-9 place-items-center rounded-md text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
        onClick={dismissUpdateNotice}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </aside>
  );
}
