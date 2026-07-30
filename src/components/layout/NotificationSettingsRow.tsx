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
    <section className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-black text-slate-950">{t('notifications')}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{statusText}</p>
          {message && <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {!state.enabled && state.supported && !state.blocked && (
            <button
              className="h-9 rounded-md border border-emerald-700 bg-emerald-700 px-3 text-sm font-black text-white transition hover:border-emerald-800 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600"
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
      <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:max-w-xs">
        <label className="grid gap-1">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t('dailyReminderTime')}</span>
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-700"
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
