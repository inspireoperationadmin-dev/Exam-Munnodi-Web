import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { WhatsAppLink } from '../ui/WhatsAppLink';
import { theme } from '../../theme/theme';

interface AuthLayoutProps {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  footerText?: string;
  footerAction?: string;
  footerHref?: string;
  supportMessage?: string;
  title?: string;
}

export function AuthLayout({
  children,
  backHref = '/',
  backLabel,
  footerText,
  footerAction,
  footerHref,
  supportMessage,
  title,
}: AuthLayoutProps) {
  const { t } = useLanguage();

  return (
    <main className={theme.shell.main}>
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:px-6">
        <header>
          <Link className={theme.link.subtleButton} to={backHref}>
            <span aria-hidden="true" className="mr-2 text-lg leading-none">&lt;</span>
            {backLabel || t('backToHome')}
          </Link>
        </header>

        <section className="grid flex-1 content-center py-6">
          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
          {title && (
            <h1 className="mb-5 text-2xl font-black leading-tight text-slate-950">
              {title}
            </h1>
          )}

          {children}

          {footerText && footerAction && footerHref && (
            <p className="mt-5 text-center text-sm font-semibold text-slate-600">
              {footerText}{' '}
              <Link className={theme.link.text} to={footerHref}>
                {footerAction}
              </Link>
            </p>
          )}

          {supportMessage && (
            <WhatsAppLink
              className="mt-5 min-h-12 border-emerald-100 bg-emerald-50 text-emerald-800 hover:border-emerald-200 hover:bg-emerald-100"
              fullWidth
              label={t('needHelp')}
              message={supportMessage}
            />
          )}
          </div>
        </section>
      </section>
    </main>
  );
}
