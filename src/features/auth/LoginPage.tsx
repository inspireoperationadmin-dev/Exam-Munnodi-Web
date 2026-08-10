import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { PasswordField } from '../../components/ui/PasswordField';
import { useLanguage } from '../../i18n/LanguageContext';
import { loginStudent } from '../../services/authService';
import { getLoginErrorMessage } from '../../utils/errors';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { t } = useLanguage();
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : '/';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const auth = await loginStudent({ email, password });
      saveAuth(auth);

      if (!auth.isEmailVerified) {
        navigate('/verify-email', { replace: true });
      } else if (!auth.isProfileSetup) {
        navigate('/setup', { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError, t('loginError')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      footerText={t('noAccount')}
      footerAction={t('createAccount')}
      footerHref="/register"
      supportMessage="Hi Exam Munnodi, I need help signing in to my student account."
      title={t('welcomeBack')}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error && <AlertMessage>{error}</AlertMessage>}
        <FormField
          label={t('email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordField
          label={t('password')}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button
          fullWidth
          disabled={submitting}
        >
          {submitting ? t('loading') : t('signIn')}
        </Button>
      </form>
      <LoadingOverlay label={t('signingIn')} open={submitting} />
    </AuthLayout>
  );
}
