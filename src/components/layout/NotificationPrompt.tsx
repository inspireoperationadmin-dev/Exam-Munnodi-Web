import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  dismissNotificationPromptForAWeek,
  enableStudyNotifications,
  shouldShowNotificationPrompt,
} from '../../services/notificationService';

export function NotificationPrompt() {
  const location = useLocation();
  const { auth, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const isReady = !!auth?.isEmailVerified && !!auth.isProfileSetup;
  const visible = useMemo(
    () => !hidden && shouldShowNotificationPrompt(location.pathname, isAuthenticated, isReady),
    [hidden, isAuthenticated, isReady, location.pathname],
  );

  if (!visible) return null;

  async function enable() {
    setSaving(true);
    setMessage('');

    try {
      await enableStudyNotifications();
      setHidden(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('notificationEnableError'));
    } finally {
      setSaving(false);
    }
  }

  function dismiss() {
    dismissNotificationPromptForAWeek();
    setHidden(true);
  }

  return (
    <aside className="fixed inset-x-3 bottom-16 z-40 mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10 sm:right-5 sm:left-auto">
      <div className="grid gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{t('notificationPromptTitle')}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{t('notificationPromptText')}</p>
          {message && <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={saving} onClick={dismiss} type="button" variant="secondary">
            {t('notNow')}
          </Button>
          <Button disabled={saving} onClick={() => void enable()} type="button">
            {saving ? t('saving') : t('enableNotifications')}
          </Button>
        </div>
      </div>
    </aside>
  );
}
