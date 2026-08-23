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

export function NotificationPrompt({ navigationVisible = false }: { navigationVisible?: boolean }) {
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
    <aside className={`fixed inset-x-3 z-40 mx-auto max-w-md rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] p-3 shadow-[var(--sf-shadow-md)] sm:right-5 sm:left-auto ${navigationVisible ? 'bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-5' : 'bottom-4 sm:bottom-5'}`}>
      <div className="grid gap-3">
        <div>
          <p className="text-sm font-black text-[var(--sf-text)]">{t('notificationPromptTitle')}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-[var(--sf-text-muted)]">{t('notificationPromptText')}</p>
          {message && <p className="mt-2 text-xs font-bold leading-5 text-[var(--sf-text-muted)]">{message}</p>}
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
