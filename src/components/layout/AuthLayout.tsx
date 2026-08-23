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
          <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[var(--sf-shadow-sm)] sm:p-6">
          {title && (
            <h1 className="mb-5 text-2xl font-black leading-tight text-[var(--sf-text)]">
              {title}
            </h1>
          )}

          {children}

          {footerText && footerAction && footerHref && (
            <p className="mt-5 text-center text-sm font-semibold text-[var(--sf-text-muted)]">
              {footerText}{' '}
              <Link className={theme.link.text} to={footerHref}>
                {footerAction}
              </Link>
            </p>
          )}

          {supportMessage && (
            <WhatsAppLink
              className="mt-5 min-h-12 border-[var(--sf-border)] bg-[var(--sf-surface-muted)] text-[var(--sf-primary)] hover:border-[var(--sf-border-strong)] hover:bg-[var(--sf-surface-muted)]"
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
