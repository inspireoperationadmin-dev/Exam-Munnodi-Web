import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppLogo } from '../../components/layout/AppLogo';
import { LanguageSelect } from '../../components/layout/LanguageSelect';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Eyebrow, Panel } from '../../components/ui/Layout';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { getActiveSession } from '../../services/examService';
import type { StudentProfile } from '../../types/academic';
import type { ActiveSession } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errors';

function formatRemaining(seconds: number | null) {
  if (seconds === null) return '';
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return `${minutes} min`;
}

function BenefitCard({ title, text, index }: { title: string; text: string; index: number }) {
  return (
    <article className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-xs font-black text-slate-600">{index}</span>
      <div>
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{text}</p>
      </div>
    </article>
  );
}

export function LandingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { auth, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !auth?.isEmailVerified || !auth.isProfileSetup) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getStudentProfile(),
      getActiveSession().catch(() => null),
    ])
      .then(([data, activeSessionData]) => {
        if (active) {
          setProfile(data);
          setActiveSession(activeSessionData);
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
  }, [auth?.isEmailVerified, auth?.isProfileSetup, isAuthenticated, t]);

  if (isAuthenticated && auth && !auth.isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (isAuthenticated && auth && !auth.isProfileSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (!isAuthenticated) {
    return (
      <main className={theme.shell.main}>
        <section className={`${theme.shell.centered} ${theme.width.lg}`}>
          <header className={theme.shell.header}>
            <AppLogo label={t('brandName')} />
            <LanguageSelect />
          </header>

          <div className="grid flex-1 content-center gap-4 py-6">
            <Panel>
              <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <p className={theme.text.eyebrow}>{t('publicLandingEyebrow')}</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  {t('publicLandingTitle')}
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                  {t('publicLandingSubtitle')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <ButtonLink size="sm" to="/login" variant="primary">
                  {t('signIn')}
                </ButtonLink>
                <ButtonLink size="sm" to="/register" variant="secondary">
                  {t('createAccount')}
                </ButtonLink>
              </div>
            </section>
            </Panel>

            <section className="grid gap-3 md:grid-cols-3">
              <BenefitCard
                index={1}
                title={t('landingBenefitPapersTitle')}
                text={t('landingBenefitPapersText')}
              />
              <BenefitCard
                index={2}
                title={t('landingBenefitPracticeTitle')}
                text={t('landingBenefitPracticeText')}
              />
              <BenefitCard
                index={3}
                title={t('landingBenefitProgressTitle')}
                text={t('landingBenefitProgressText')}
              />
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={theme.shell.main}>
      <section className={`${theme.shell.centered} ${theme.width.lg}`}>
        <header className={theme.shell.header}>
          <AppLogo label={t('brandName')} />
          <ProfileAvatar name={profile?.fullName} email={auth?.email} />
        </header>

        <div className="grid flex-1 content-center gap-4 py-6">
          <Panel className="p-4 sm:p-4">
            <Eyebrow>{t('studentLandingEyebrow')}</Eyebrow>
            <h1 className="mt-2 max-w-3xl text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              {t('studentLandingTitle')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              {t('studentLandingSubtitle')}
            </p>
          </Panel>

          {error && <AlertMessage>{error}</AlertMessage>}

          {activeSession && (
            <Panel>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <Eyebrow>{t('continueCurrentSession')}</Eyebrow>
                  <h2 className="mt-1 break-words text-xl font-black text-slate-950">
                    {activeSession.title || t(activeSession.mode === 'MockExam' ? 'mockExam' : activeSession.mode === 'Practice' ? 'practice' : 'paperExam')}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {activeSession.answeredCount}/{activeSession.totalQuestions} {t('answered')}
                    {activeSession.remainingSeconds !== null ? ` - ${t('timeRemaining')}: ${formatRemaining(activeSession.remainingSeconds)}` : ''}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/exam?sessionId=${encodeURIComponent(activeSession.sessionId)}&backPath=${encodeURIComponent('/')}`)}
                  size="sm"
                  type="button"
                >
                  {t('resumeSession')}
                </Button>
              </div>
            </Panel>
          )}

          <section className="grid gap-3 sm:grid-cols-3">
            {loading ? (
              <Panel className="text-sm font-bold text-slate-500 sm:col-span-3">
                {t('loading')}
              </Panel>
            ) : profile?.subjects.length ? (
              profile.subjects.slice(0, 3).map((subject) => (
                <article
                  key={subject.id}
                  className={`min-h-32 ${theme.card.static}`}
                >
                  <span className={theme.text.eyebrow}>
                    {t('subject')}
                  </span>
                  <span className="mt-2 block text-lg font-black leading-7 text-slate-950">
                    {subject.name}
                  </span>
                  <ButtonLink
                    className="mt-5"
                    size="sm"
                    to={`/subject?subjectId=${encodeURIComponent(subject.id)}`}
                    variant="primary"
                  >
                    {t('openSubject')}
                  </ButtonLink>
                </article>
              ))
            ) : (
              <div className={`${theme.card.dashed} sm:col-span-3`}>
                <h3 className="text-lg font-black text-slate-950">{t('noSubjects')}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{t('profileRequired')}</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
