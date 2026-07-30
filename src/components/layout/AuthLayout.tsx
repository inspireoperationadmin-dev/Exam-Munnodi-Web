import { Link } from 'react-router-dom';
import { AppLogo } from './AppLogo';
import { LanguageSelect } from './LanguageSelect';
import { useLanguage } from '../../i18n/LanguageContext';
import { Panel } from '../ui/Layout';
import { WhatsAppLink } from '../ui/WhatsAppLink';
import { theme } from '../../theme/theme';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerAction: string;
  footerHref: string;
  supportMessage?: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerAction,
  footerHref,
  supportMessage,
}: AuthLayoutProps) {
  const { t } = useLanguage();

  return (
    <main className={theme.shell.main}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          className={theme.link.subtleButton}
          to="/"
        >
          {t('backToHome')}
        </Link>
        <div className="flex items-center gap-3">
          <AppLogo className="hidden sm:inline-flex" label={t('brandName')} />
          <LanguageSelect />
        </div>
      </header>

      <section className={theme.shell.authContent}>
        <Panel className="mx-auto w-full max-w-md">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
            <p className={`mt-2 ${theme.text.body}`}>{subtitle}</p>
          </div>

          {children}

          <p className="mt-5 text-center text-sm font-medium text-slate-600">
            {footerText}{' '}
            <Link className={theme.link.text} to={footerHref}>
              {footerAction}
            </Link>
          </p>

          {supportMessage && (
            <div className="mt-4 flex justify-center">
              <WhatsAppLink label={t('needHelp')} message={supportMessage} />
            </div>
          )}
        </Panel>
      </section>
    </main>
  );
}
