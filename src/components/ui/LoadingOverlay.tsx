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
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm"
      role="status"
    >
      <section className="grid w-full max-w-xs justify-items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 text-center shadow-xl">
        <img
          alt=""
          className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-cover p-1 motion-safe:animate-pulse"
          src="/favicon.png"
        />
        <p className={theme.text.panelTitle}>{label}</p>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 rounded-full bg-emerald-700 motion-safe:animate-[loading-slide_1s_ease-in-out_infinite]" />
        </div>
      </section>
    </div>
  );
}
