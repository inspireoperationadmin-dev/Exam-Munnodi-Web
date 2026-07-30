import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageSelect } from '../../components/layout/LanguageSelect';
import { NotificationSettingsRow } from '../../components/layout/NotificationSettingsRow';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import type { StudentProfile } from '../../types/academic';
import { theme } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errors';
import { useAuth } from '../auth/AuthContext';

export function ProfilePage() {
  const { t } = useLanguage();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getStudentProfile()
      .then((data) => {
        if (active) {
          setProfile(data);
        }
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('loadProfileError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  function confirmLogout() {
    setConfirmLogoutOpen(false);
    logout();
    navigate('/');
  }

  return (
    <PageShell maxWidth="md">
        <PageHeader>
          <Link
            className={theme.link.subtleButton}
            to="/"
          >
            {t('backToHome')}
          </Link>
        </PageHeader>

        {error && <AlertMessage>{error}</AlertMessage>}

        <Panel>
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-700 text-white">
              <span className="relative block h-7 w-7" aria-hidden="true">
                <span className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white" />
                <span className="absolute bottom-0 left-1/2 h-3.5 w-6 -translate-x-1/2 rounded-t-full border-2 border-white border-b-0" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{t('profile')}</p>
              <h1 className="mt-1 break-words text-2xl font-black leading-tight text-slate-950">
                {loading ? t('loading') : profile?.fullName || auth?.email || 'Student'}
              </h1>
              {auth?.email && <p className="mt-2 break-words text-sm font-bold text-slate-500">{auth.email}</p>}
            </div>
          </div>

          <section className={`mt-6 ${theme.panel.muted}`}>
            <label className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <span>
                <span className="block text-sm font-black text-slate-950">{t('uiLanguage')}</span>
              </span>
              <LanguageSelect />
            </label>
          </section>

          <NotificationSettingsRow />

          <dl className="mt-6 grid gap-3">
            <div className={theme.panel.inset}>
              <dt className="text-sm font-bold text-slate-500">{t('stream')}</dt>
              <dd className="mt-1 font-black text-slate-950">{profile?.streamName || '-'}</dd>
            </div>
          </dl>

          <Button
            className="mt-6"
            onClick={() => setConfirmLogoutOpen(true)}
            type="button"
            variant="danger"
          >
            {t('logout')}
          </Button>
        </Panel>

      <ConfirmDialog
        cancelLabel={t('cancel')}
        confirmLabel={t('logout')}
        danger
        message={t('logoutConfirm')}
        onCancel={() => setConfirmLogoutOpen(false)}
        onConfirm={confirmLogout}
        open={confirmLogoutOpen}
        title={t('logout')}
      />
    </PageShell>
  );
}
