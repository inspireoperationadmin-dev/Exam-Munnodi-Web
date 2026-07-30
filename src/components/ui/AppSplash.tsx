import { theme } from '../../theme/theme';

interface AppSplashProps {
  label: string;
}

export function AppSplash({ label }: AppSplashProps) {
  return (
    <main className={`grid min-h-screen place-items-center ${theme.colors.page} px-4`}>
      <section className="grid justify-items-center gap-4 text-center">
        <img
          alt=""
          className="h-20 w-20 rounded-xl border border-slate-200 bg-white object-cover p-1 shadow-sm motion-safe:animate-pulse"
          src="/favicon.png"
        />
        <div>
          <p className={theme.text.brand}>{label}</p>
          <div className="mx-auto mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 rounded-full bg-emerald-700 motion-safe:animate-[loading-slide_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </section>
    </main>
  );
}
