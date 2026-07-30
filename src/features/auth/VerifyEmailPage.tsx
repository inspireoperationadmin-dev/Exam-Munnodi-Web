import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLogo } from '../../components/layout/AppLogo';
import { LanguageSelect } from '../../components/layout/LanguageSelect';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { Panel } from '../../components/ui/Layout';
import { WhatsAppLink } from '../../components/ui/WhatsAppLink';
import { useLanguage } from '../../i18n/LanguageContext';
import { sendOtp, verifyOtp } from '../../services/authService';
import { theme } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errors';
import { useAuth } from './AuthContext';

export function VerifyEmailPage() {
  const { t } = useLanguage();
  const { auth, saveAuth } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) return;
    setError('');
    setSubmitting(true);

    try {
      const nextAuth = await verifyOtp(auth.email, code);
      saveAuth(nextAuth);
      navigate(nextAuth.isProfileSetup ? '/' : '/setup', { replace: true });
    } catch (verifyError) {
      setError(getErrorMessage(verifyError, 'OTP verification failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!auth) return;
    setError('');
    setMessage('');
    try {
      const response = await sendOtp(auth.email);
      setMessage(response.message);
    } catch (sendError) {
      setError(getErrorMessage(sendError, 'Could not send OTP.'));
    }
  }

  return (
    <main className={theme.shell.main}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          className={theme.link.subtleButton}
          to="/login"
        >
          {t('backToLogin')}
        </Link>
        <div className="flex items-center gap-3">
          <AppLogo className="hidden sm:inline-flex" label={t('brandName')} />
          <LanguageSelect />
        </div>
      </header>

      <section className={theme.shell.authContent}>
        <Panel className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-950">{t('verifyTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t('verifySubtitle')}</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{auth?.email}</p>

          <form className="mt-5 grid gap-4" onSubmit={handleVerify}>
            {message && <AlertMessage tone="info">{message}</AlertMessage>}
            {error && <AlertMessage>{error}</AlertMessage>}
            <FormField
              label={t('otpCode')}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              required
            />
            <Button
              fullWidth
              disabled={submitting}
            >
              {submitting ? t('loading') : t('verifyEmail')}
            </Button>
          </form>

          <Button
            className="mt-4"
            fullWidth
            onClick={handleResend}
            type="button"
            variant="secondary"
          >
            {t('resendOtp')}
          </Button>

          <div className="mt-4">
            <WhatsAppLink
              fullWidth
              label={t('needHelp')}
              message={`Hi Exam Munnodi, I need help with OTP verification. Email: ${auth?.email || '-'}`}
            />
          </div>
        </Panel>
      </section>
      <LoadingOverlay label={t('verifyingOtp')} open={submitting} />
    </main>
  );
}
