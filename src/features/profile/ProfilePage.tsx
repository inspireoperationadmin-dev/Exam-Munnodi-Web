import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, ChevronRight, CreditCard, GraduationCap, Languages, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationSettingsRow } from '../../components/layout/NotificationSettingsRow';
import { ThemeModeSelector } from '../../components/layout/ThemeModeSelector';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { LoadingPanel, PageShell } from '../../components/ui/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import type { StudentProfile } from '../../types/academic';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';
import { useAuth } from '../auth/AuthContext';
import { useSubscription } from '../subscription/SubscriptionContext';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-h-15 items-center gap-3 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--sf-selected-soft)] text-[var(--sf-brand)]">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-bold text-[var(--sf-text-muted)]">{label}</dt>
        <dd className="mt-1 break-words text-sm font-black text-[var(--sf-text)]">{value}</dd>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useLanguage();
  const { auth, logout } = useAuth();
  const { status: subscription } = useSubscription();
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
        if (active) setProfile(data);
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

  const academicLanguage = mediumToLanguage(profile?.medium || 'English');

  return (
    <PageShell maxWidth="md">
      <header className="py-1">
        <h1 className="text-2xl font-black leading-tight text-[var(--sf-text)] sm:text-3xl">{t('profile')}</h1>
      </header>

      {error && <AlertMessage>{error}</AlertMessage>}

      {loading ? (
        <LoadingPanel label={t('loading')} />
      ) : (
        <>
          <section className="flex items-center gap-4 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-md)] sm:p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--sf-primary)] text-[var(--sf-primary-text)]">
              <UserRound aria-hidden="true" className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h2 className="break-words text-xl font-black leading-7 text-[var(--sf-text)]">
                {profile?.fullName || auth?.email || 'Student'}
              </h2>
              {auth?.email && <p className="mt-1 break-words text-sm font-bold text-[var(--sf-text-muted)]">{auth.email}</p>}
            </div>
          </section>

          <section aria-labelledby="study-profile-title">
            <h2 className="text-lg font-black text-[var(--sf-text)]" id="study-profile-title">Study profile</h2>
            <dl className="mt-3 divide-y divide-[var(--sf-border)] overflow-hidden rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-sm)]">
              <DetailRow icon={GraduationCap} label={t('stream')} value={profile?.streamName || '-'} />
              <DetailRow icon={Languages} label={t('medium')} value={profile?.medium || '-'} />
              <DetailRow icon={CalendarDays} label={t('examYear')} value={profile?.examYear || '-'} />
              <DetailRow
                icon={BookOpen}
                label={t('subjects')}
                value={profile?.subjects.length ? (
                  <span className="flex flex-wrap gap-2">
                    {profile.subjects.map((subject) => (
                      <span className="rounded-md bg-[var(--sf-surface-muted)] px-2 py-1 text-xs font-black text-[var(--sf-text-soft)]" key={subject.id}>
                        {getAcademicName(subject, academicLanguage)}
                      </span>
                    ))}
                  </span>
                ) : '-'}
              />
            </dl>
          </section>

          <section aria-labelledby="profile-subscription-title">
            <h2 className="text-lg font-black text-[var(--sf-text)]" id="profile-subscription-title">{t('subscription')}</h2>
            <Link
              className="group mt-3 flex min-h-20 items-center gap-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] transition hover:border-[var(--sf-border-strong)] hover:shadow-[var(--sf-shadow-md)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
              to="/subscription"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--sf-selected-soft)] text-[var(--sf-brand)]">
                <CreditCard aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-base font-black text-[var(--sf-text)]">
                  {subscription?.planName || subscription?.tier || t('subscriptionUnknown')}
                </span>
                <span className="mt-1 block text-xs font-bold text-[var(--sf-text-muted)]">
                  {subscription?.daysRemaining === null
                    ? 'Free forever'
                    : subscription?.endsAt
                      ? `Ends ${formatDate(subscription.endsAt)} · ${subscription.daysRemaining} ${t('daysRemaining')}`
                      : t('manageSubscription')}
                </span>
                {subscription?.upcomingSubscription && (
                  <span className="mt-1 block text-xs font-black text-[var(--sf-brand)]">
                    Next: {subscription.upcomingSubscription.planName} on {formatDate(subscription.upcomingSubscription.startsAt)}
                  </span>
                )}
              </span>
              <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--sf-text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--sf-brand)]" />
            </Link>
          </section>

          <section aria-labelledby="preferences-title">
            <h2 className="text-lg font-black text-[var(--sf-text)]" id="preferences-title">Preferences</h2>
            <ThemeModeSelector />
            <NotificationSettingsRow />
          </section>

          <section aria-labelledby="account-title">
            <h2 className="text-lg font-black text-[var(--sf-text)]" id="account-title">Account</h2>
            <Button
              className="mt-3"
              fullWidth
              onClick={() => setConfirmLogoutOpen(true)}
              size="lg"
              type="button"
              variant="danger"
            >
              {t('logout')}
            </Button>
          </section>
        </>
      )}

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
