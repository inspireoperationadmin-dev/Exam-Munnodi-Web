import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { theme } from '../../theme/theme';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { useAuth } from '../../features/auth/AuthContext';

function feedbackMessage(pathname: string, search: string, email?: string) {
  const params = new URLSearchParams(search);
  const sessionId = params.get('sessionId');

  if (pathname === '/exam-result') {
    return `Hi Exam Munnodi, I want to share feedback about my exam result. Session: ${sessionId || '-'}. Email: ${email || '-'}`;
  }

  if (pathname === '/profile') {
    return `Hi Exam Munnodi, I want to share feedback from my profile page. Email: ${email || '-'}`;
  }

  if (pathname === '/') {
    return `Hi Exam Munnodi, I want to share feedback from the home page. Email: ${email || '-'}`;
  }

  return `Hi Exam Munnodi, I want to share feedback. Page: ${pathname || '/'}. Email: ${email || '-'}`;
}

export function FloatingFeedbackButton() {
  const { t } = useLanguage();
  const { auth, isAuthenticated } = useAuth();
  const location = useLocation();
  const hiddenRoutes = ['/login', '/register', '/verify-email', '/setup', '/exam'];
  const hidden = hiddenRoutes.includes(location.pathname);
  const navigationHiddenRoutes = ['/exam', '/exam-result'];
  const navigationVisible = Boolean(
    isAuthenticated
    && auth?.isEmailVerified
    && auth.isProfileSetup
    && !navigationHiddenRoutes.includes(location.pathname),
  );
  const message = useMemo(
    () => feedbackMessage(location.pathname, location.search, auth?.email),
    [auth?.email, location.pathname, location.search],
  );

  if (hidden) return null;

  return (
    <a
      aria-label={t('feedback')}
      className={`${theme.feedback.button} ${navigationVisible ? theme.feedback.positionWithNavigation : theme.feedback.positionDefault}`}
      href={buildWhatsAppUrl(message)}
      rel="noreferrer"
      target="_blank"
      title={t('feedback')}
    >
      <span className={theme.feedback.icon} aria-hidden="true">
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 8h10M7 12h6m-8.5 8 3.2-2.4H18a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7.6A3 3 0 0 0 4.5 17.2V20Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </span>
      <span className={theme.feedback.label}>{t('feedback')}</span>
    </a>
  );
}
