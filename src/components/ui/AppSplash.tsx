import { ThemeAppIcon } from '../layout/ThemeAppIcon';
import { theme } from '../../theme/theme';

interface AppSplashProps {
  label: string;
}

export function AppSplash({ label }: AppSplashProps) {
  return (
    <main className={`grid min-h-screen place-items-center ${theme.colors.page} px-4`}>
      <section className="grid justify-items-center gap-4 text-center">
        <ThemeAppIcon
          alt={label}
          className="h-20 w-auto max-w-64 object-contain motion-safe:animate-pulse"
        />
        <div>
          <p className={theme.text.brand}>{label}</p>
          <div className="mx-auto mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-[var(--sf-progress-track)]">
            <div className="h-full w-1/2 rounded-full bg-[var(--sf-primary)] motion-safe:animate-[loading-slide_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </section>
    </main>
  );
}
