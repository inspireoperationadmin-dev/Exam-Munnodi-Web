import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useLanguage } from '../../i18n/LanguageContext';
import { sendOtp, verifyOtp } from '../../services/authService';
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
    <AuthLayout
      backHref="/login"
      backLabel={t('backToLogin')}
      supportMessage={`Hi Exam Munnodi, I need help with OTP verification. Email: ${auth?.email || '-'}`}
      title={t('verifyEmail')}
    >
      <form className="grid gap-4" onSubmit={handleVerify}>
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
      <LoadingOverlay label={t('verifyingOtp')} open={submitting} />
    </AuthLayout>
  );
}
