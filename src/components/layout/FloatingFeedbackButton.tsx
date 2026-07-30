import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
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
  const { auth } = useAuth();
  const location = useLocation();
  const hiddenRoutes = ['/login', '/register', '/verify-email', '/setup', '/exam'];
  const hidden = hiddenRoutes.includes(location.pathname);
  const message = useMemo(
    () => feedbackMessage(location.pathname, location.search, auth?.email),
    [auth?.email, location.pathname, location.search],
  );

  if (hidden) return null;

  return (
    <a
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-lg shadow-slate-950/10 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
      href={buildWhatsAppUrl(message)}
      rel="noreferrer"
      target="_blank"
    >
      {t('feedback')}
    </a>
  );
}
