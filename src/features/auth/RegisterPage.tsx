import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { PasswordField } from '../../components/ui/PasswordField';
import { useLanguage } from '../../i18n/LanguageContext';
import { registerStudent } from '../../services/authService';
import { getRegisterErrorMessage } from '../../utils/errors';
import { useAuth } from './AuthContext';

export function RegisterPage() {
  const { t } = useLanguage();
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const auth = await registerStudent({
        fullName,
        email,
        password,
        phoneNumber: phoneNumber.trim() || null,
      });
      saveAuth(auth);

      if (!auth.isEmailVerified) {
        navigate('/verify-email', { replace: true });
      } else {
        navigate('/setup', { replace: true });
      }
    } catch (registerError) {
      setError(getRegisterErrorMessage(registerError, t('registerError')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
      footerText={t('haveAccount')}
      footerAction={t('signIn')}
      footerHref="/login"
      supportMessage="Hi Exam Munnodi, I need help creating my student account."
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
          label={`${t('phoneNumber')} (${t('optional')})`}
          autoComplete="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
        <PasswordField
          label={t('password')}
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button
          fullWidth
          disabled={submitting}
        >
          {submitting ? t('loading') : t('createAccount')}
        </Button>
      </form>
      <LoadingOverlay label={t('creatingAccount')} open={submitting} />
    </AuthLayout>
  );
}
