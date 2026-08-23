import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  enableStudyNotifications,
  getNotificationControlState,
  getNotificationPreferences,
  getNotificationSettingsState,
  updateNotificationPreferences,
  type NotificationPreference,
} from '../../services/notificationService';

export function NotificationSettingsRow() {
  const { t } = useLanguage();
  const [state, setState] = useState(getNotificationControlState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [preferences, setPreferences] = useState<NotificationPreference>({
    studyRemindersEnabled: true,
    dailyReminderTime: '18:30',
    timeZoneId: 'Asia/Colombo',
  });

  useEffect(() => {
    void refresh();

    function refresh() {
      getNotificationSettingsState()
        .then(setState)
        .catch(() => setState(getNotificationControlState()));
    }

    getNotificationPreferences()
      .then(setPreferences)
      .catch(() => undefined);

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  async function toggle() {
    if (state.blocked || !state.supported || saving) return;

    setSaving(true);
    setMessage('');

    try {
      await enableStudyNotifications();
      await savePreferences({
        ...preferences,
        studyRemindersEnabled: true,
      }, false);

      setState(await getNotificationSettingsState());
    } catch (error) {
      setState(await getNotificationSettingsState().catch(() => getNotificationControlState()));
      setMessage(error instanceof Error ? error.message : t('notificationEnableError'));
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences(next: NotificationPreference, manageSaving = true) {
    setPreferences(next);
    if (manageSaving) setSaving(true);
    setMessage('');

    try {
      setPreferences(await updateNotificationPreferences({
        ...next,
        studyRemindersEnabled: true,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('notificationEnableError'));
    } finally {
      if (manageSaving) setSaving(false);
    }
  }

  const statusText = !state.supported
    ? t('notificationsUnsupported')
    : state.blocked
      ? t('notificationsBlocked')
      : state.enabled
        ? t('notificationsEnabled')
        : t('notificationsDisabled');

  return (
    <section className="mt-3 rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-black text-[var(--sf-text)]">{t('notifications')}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[var(--sf-text-muted)]">{statusText}</p>
          {message && <p className="mt-2 text-xs font-bold leading-5 text-[var(--sf-text-muted)]">{message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {!state.enabled && state.supported && !state.blocked && (
            <button
              className="h-9 rounded-lg border border-[var(--sf-primary)] bg-[var(--sf-primary)] px-3 text-sm font-black text-[var(--sf-primary-text)] transition hover:border-[var(--sf-primary-hover)] hover:bg-[var(--sf-primary-hover)] disabled:cursor-not-allowed disabled:border-[var(--sf-border-strong)] disabled:bg-[var(--sf-border-strong)] disabled:text-[var(--sf-text-muted)]"
              disabled={saving}
              onClick={() => void toggle()}
              type="button"
            >
              {saving ? t('saving') : t('enableNotifications')}
            </button>
          )}
        </div>
      </div>

      {state.enabled && (
      <div className="mt-3 grid gap-3 border-t border-[var(--sf-border)] pt-3 sm:max-w-xs">
        <label className="grid gap-1">
          <span className="text-xs font-black uppercase tracking-wide text-[var(--sf-text-muted)]">{t('dailyReminderTime')}</span>
          <input
            className="h-10 rounded-lg border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-3 text-sm font-bold text-[var(--sf-text)] outline-none transition focus:border-[var(--sf-brand)] focus:ring-4 focus:ring-[var(--sf-focus)]"
            disabled={saving}
            onChange={(event) => void savePreferences({
              ...preferences,
              studyRemindersEnabled: true,
              dailyReminderTime: event.target.value,
            })}
            type="time"
            value={preferences.dailyReminderTime}
          />
        </label>
      </div>
      )}
    </section>
  );
}
