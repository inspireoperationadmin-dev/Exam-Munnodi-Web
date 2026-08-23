import { ThemeAppIcon } from '../layout/ThemeAppIcon';
import { theme } from '../../theme/theme';

interface LoadingOverlayProps {
  label: string;
  open: boolean;
}

export function LoadingOverlay({ label, open }: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--sf-scrim)] px-4 backdrop-blur-sm"
      role="status"
    >
      <section className="grid w-full max-w-xs justify-items-center gap-3 rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 text-center shadow-[var(--sf-shadow-md)]">
        <ThemeAppIcon
          alt=""
          className="h-14 w-auto max-w-44 object-contain motion-safe:animate-pulse"
        />
        <p className={theme.text.panelTitle}>{label}</p>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--sf-progress-track)]">
          <div className="h-full w-1/2 rounded-full bg-[var(--sf-primary)] motion-safe:animate-[loading-slide_1s_ease-in-out_infinite]" />
        </div>
      </section>
    </div>
  );
}
