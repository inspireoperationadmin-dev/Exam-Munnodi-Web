import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Circle } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { PasswordField } from '../../components/ui/PasswordField';
import { useLanguage } from '../../i18n/LanguageContext';
import { registerStudent, sendOtp, verifyOtp } from '../../services/authService';
import { getErrorMessage } from '../../utils/errors';
import { useAuth } from './AuthContext';
import { useRegistration } from './RegistrationContext';

type PendingOperation = 'verify' | 'send' | null;

export function VerifyEmailPage() {
  const { t } = useLanguage();
  const { auth, saveAuth } = useAuth();
  const {
    draft,
    password,
    registrationTicket,
    clearRegistration,
    markOtpSent,
    setPassword,
    setRegistrationTicket,
  } = useRegistration();
  const navigate = useNavigate();
  const legacyEmail = auth && !auth.isEmailVerified ? auth.email : '';
  const email = draft?.email || legacyEmail;
  const isNewRegistration = Boolean(draft);
  const [showPasswordField] = useState(() => Boolean(draft && !password));
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(Boolean(draft));
  const [legacyResendAvailableAt, setLegacyResendAvailableAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [operation, setOperation] = useState<PendingOperation>(null);

  const resendAvailableAt = draft?.resendAvailableAt || legacyResendAvailableAt;
  const resendSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  const passwordRequirements = [
    { label: t('passwordRuleLength'), met: password.length >= 8 },
    { label: t('passwordRuleUppercase'), met: /[A-Z]/.test(password) },
    { label: t('passwordRuleLowercase'), met: /[a-z]/.test(password) },
    { label: t('passwordRuleNumber'), met: /\d/.test(password) },
  ];
  const passwordValid = passwordRequirements.every((requirement) => requirement.met);

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  if (auth?.isEmailVerified && !draft) {
    return <Navigate to={auth.isProfileSetup ? '/' : '/setup'} replace />;
  }

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  async function finishNewRegistration(ticket: string) {
    if (!draft) throw new Error(t('registrationExpired'));

    const nextAuth = await registerStudent({
      registrationTicket: ticket,
      fullName: draft.fullName,
      email: draft.email,
      password,
      phoneNumber: draft.phoneNumber,
    });

    saveAuth(nextAuth);
    clearRegistration();
    navigate('/setup', { replace: true });
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (code.length !== 6) {
      setError(t('otpSixDigits'));
      return;
    }

    if (isNewRegistration && !passwordValid) {
      setPasswordTouched(true);
      setError(t('passwordRequiredAfterRefresh'));
      return;
    }

    setOperation('verify');

    try {
      if (registrationTicket) {
        await finishNewRegistration(registrationTicket);
        return;
      }

      const result = await verifyOtp(email, code);

      if (!result.requiresAccountCreation) {
        if (!result.authentication) throw new Error(t('otpVerificationError'));
        saveAuth(result.authentication);
        clearRegistration();
        navigate(result.authentication.isProfileSetup ? '/' : '/setup', { replace: true });
        return;
      }

      if (!result.registrationTicket || !draft) {
        throw new Error(t('registrationExpired'));
      }

      setRegistrationTicket(result.registrationTicket);
      await finishNewRegistration(result.registrationTicket);
    } catch (verifyError) {
      setError(getErrorMessage(verifyError, t('otpVerificationError')));
    } finally {
      setOperation(null);
    }
  }

  async function handleSendCode() {
    if (resendSeconds > 0 || operation) return;

    setError('');
    setMessage('');
    setOperation('send');

    try {
      const response = await sendOtp(email);
      if (draft) {
        markOtpSent();
      } else {
        setLegacyResendAvailableAt(Date.now() + 60_000);
      }
      setRegistrationTicket('');
      setCode('');
      setCodeRequested(true);
      setNow(Date.now());
      setMessage(response.message || t('verificationCodeSent'));
    } catch (sendError) {
      setError(getErrorMessage(sendError, t('otpSendError')));
    } finally {
      setOperation(null);
    }
  }

  const resendLabel = resendSeconds > 0
    ? `${t('resendAvailableIn')} ${resendSeconds}s`
    : t('resendOtp');

  return (
    <AuthLayout
      backHref={isNewRegistration ? '/register' : '/login'}
      backLabel={isNewRegistration ? t('backToRegistration') : t('backToLogin')}
      supportMessage={`Hi Exam Munnodi, I need help with OTP verification. Email: ${email}`}
      title={t('verifyEmail')}
    >
      <div className="mb-4 grid gap-2">
        <p className="text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
          {codeRequested ? t('otpSentTo') : t('otpNotSentYet')} <strong className="text-[var(--sf-text)]">{email}</strong>
        </p>
        <p className="text-xs font-semibold leading-5 text-[var(--sf-text-soft)]">
          {t('otpSendPolicy')}
        </p>
      </div>

      {message && <AlertMessage tone="info">{message}</AlertMessage>}
      {error && <AlertMessage>{error}</AlertMessage>}

      {!codeRequested ? (
        <Button
          className="mt-4"
          fullWidth
          disabled={operation !== null || resendSeconds > 0}
          onClick={handleSendCode}
          type="button"
        >
          {operation === 'send' ? t('sendingVerificationCode') : t('sendVerificationCode')}
        </Button>
      ) : (
        <>
          <form className="mt-4 grid gap-4" onSubmit={handleVerify}>
            <FormField
              aria-describedby="otp-policy"
              autoComplete="one-time-code"
              inputMode="numeric"
              label={t('otpCode')}
              maxLength={6}
              pattern="[0-9]{6}"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />

            {showPasswordField && (
              <>
                <PasswordField
                  aria-describedby="verify-password-requirements"
                  aria-invalid={passwordTouched && !passwordValid}
                  autoComplete="new-password"
                  label={t('enterPasswordAgain')}
                  minLength={8}
                  value={password}
                  onBlur={() => setPasswordTouched(true)}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <div className="-mt-1 grid gap-2" id="verify-password-requirements">
                  <p className="text-xs font-bold text-[var(--sf-text-soft)]">{t('passwordRequiredAfterRefresh')}</p>
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {passwordRequirements.map((requirement) => {
                      const invalid = passwordTouched && !requirement.met;
                      return (
                        <li
                          className={`flex items-center gap-2 text-xs font-semibold ${requirement.met ? 'text-[var(--sf-success-text)]' : invalid ? 'text-[var(--sf-danger-text)]' : 'text-[var(--sf-text-muted)]'}`}
                          key={requirement.label}
                        >
                          {requirement.met ? (
                            <Check aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={3} />
                          ) : (
                            <Circle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>{requirement.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            <Button
              fullWidth
              disabled={operation !== null || code.length !== 6 || (isNewRegistration && !passwordValid)}
            >
              {operation === 'verify'
                ? t('loading')
                : t(isNewRegistration ? 'verifyAndCreateAccount' : 'verifyEmail')}
            </Button>
          </form>

          <p className="sr-only" id="otp-policy">{t('otpSendPolicy')}</p>
          <Button
            className="mt-4"
            fullWidth
            disabled={operation !== null || resendSeconds > 0}
            onClick={handleSendCode}
            type="button"
            variant="secondary"
          >
            {operation === 'send' ? t('sendingVerificationCode') : resendLabel}
          </Button>
        </>
      )}

      <LoadingOverlay
        label={operation === 'send'
          ? t('sendingVerificationCode')
          : t(isNewRegistration ? 'verifyingAndCreatingAccount' : 'verifyingOtp')}
        open={operation !== null}
      />
    </AuthLayout>
  );
}
