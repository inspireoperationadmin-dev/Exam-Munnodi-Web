import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { PasswordField } from '../../components/ui/PasswordField';
import { useLanguage } from '../../i18n/LanguageContext';
import { sendOtp } from '../../services/authService';
import { getRegisterErrorMessage } from '../../utils/errors';
import { useRegistration } from './RegistrationContext';

export function RegisterPage() {
  const { t } = useLanguage();
  const { beginRegistration } = useRegistration();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordRequirements = [
    { label: t('passwordRuleLength'), met: password.length >= 8 },
    { label: t('passwordRuleUppercase'), met: /[A-Z]/.test(password) },
    { label: t('passwordRuleLowercase'), met: /[a-z]/.test(password) },
    { label: t('passwordRuleNumber'), met: /\d/.test(password) },
  ];
  const passwordValid = passwordRequirements.every((requirement) => requirement.met);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!passwordValid) {
      setPasswordTouched(true);
      return;
    }

    setSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await sendOtp(normalizedEmail);
      beginRegistration({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: phoneNumber.trim() || null,
      }, password);

      navigate('/verify-email', { replace: true });
    } catch (registerError) {
      setError(getRegisterErrorMessage(registerError, t('registerError')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      footerText={t('haveAccount')}
      footerAction={t('signIn')}
      footerHref="/login"
      supportMessage="Hi Exam Munnodi, I need help creating my student account."
      title={t('createStudentAccount')}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error && <AlertMessage>{error}</AlertMessage>}
        <FormField
          label={t('fullName')}
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <FormField
          label={t('email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <FormField
          aria-describedby="phone-number-hint"
          label={`${t('phoneNumber')} (${t('optional')})`}
          autoComplete="tel"
          inputMode="tel"
          maxLength={20}
          pattern="[0-9+()\\s-]{7,20}"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
        <p className="-mt-2 text-xs font-semibold leading-5 text-[var(--sf-text-muted)]" id="phone-number-hint">
          {t('phoneNumberHint')}
        </p>
        <PasswordField
          label={t('password')}
          aria-describedby="password-requirements"
          aria-invalid={passwordTouched && !passwordValid}
          autoComplete="new-password"
          minLength={8}
          value={password}
          onBlur={() => setPasswordTouched(true)}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError('');
          }}
          required
        />
        <div className="-mt-1 grid gap-2" id="password-requirements">
          <p className="text-xs font-bold text-[var(--sf-text-soft)]">{t('passwordRequirements')}</p>
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
        <Button
          fullWidth
          disabled={submitting || !passwordValid}
        >
          {submitting ? t('loading') : t('createAccount')}
        </Button>
      </form>
      <LoadingOverlay label={t('sendingVerificationCode')} open={submitting} />
    </AuthLayout>
  );
}
