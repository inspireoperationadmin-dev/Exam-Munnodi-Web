import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppLogo } from '../../components/layout/AppLogo';
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
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';

function formatRemaining(seconds: number | null) {
  if (seconds === null) return '';
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return `${minutes} min`;
}

const getStartedButtonClass =
  '!border-blue-600 !bg-blue-600 !text-white shadow-sm shadow-blue-900/10 hover:!border-blue-700 hover:!bg-blue-700';

export function LandingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { auth, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const academicLanguage = mediumToLanguage(profile?.medium || 'English');

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
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink className={getStartedButtonClass} size="sm" to="/login" variant="primary">
                {t('getStarted')}
              </ButtonLink>
            </div>
          </header>

          <div className="grid flex-1 content-center gap-5 py-6">

            {/* ── Hero ── */}
            <section className="relative aspect-3/2 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm shadow-indigo-100/70 sm:aspect-auto sm:min-h-130">
              <img
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-0 h-auto w-full object-contain sm:inset-0 sm:h-full sm:object-cover sm:object-center"
                src="/images/herobanner.png"
              />
              <div className="absolute inset-0 bg-linear-to-r from-white/88 via-white/52 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/30 via-transparent to-transparent" />

              <div className="relative z-10 flex h-full items-start p-4 pt-6 sm:min-h-130 sm:p-8 sm:pt-14">
                <div className="max-w-2xl">
                  <h1 className="max-w-xl text-2xl font-black leading-tight text-slate-950 drop-shadow-sm min-[390px]:text-3xl sm:text-5xl">
                    {t('publicLandingTitleLineOne')}
                    <br />
                    {t('publicLandingTitleLineTwo')}
                    <br />
                    <span className="text-indigo-600">{t('publicLandingTitleHighlight')}</span>
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-3 sm:hidden">
                    <ButtonLink className={getStartedButtonClass} size="sm" to="/login" variant="primary">
                      {t('getStarted')}
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Benefit cards ── */}
            <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <h2 className="text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                {t('landingGoalTitle')}
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  t('landingGoalUnderstand'),
                  t('landingGoalPractice'),
                  t('landingGoalExam'),
                ].map((text, index) => (
                  <div key={text} className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-xl bg-indigo-50/60 p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm font-bold leading-6 text-slate-700 sm:text-base">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </section>
      </main>
    );
  }

  // ── Authenticated landing ──
  return (
    <main className={theme.shell.main}>
      <section className={`${theme.shell.centered} ${theme.width.lg}`}>
        <header className={theme.shell.header}>
          <AppLogo label={t('brandName')} />
          <ProfileAvatar name={profile?.fullName} email={auth?.email} />
        </header>

        <div className="grid flex-1 content-center gap-4 py-6">
          <section className="relative min-h-56 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm shadow-indigo-100/70 sm:min-h-64">
            <img
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
              src="/images/herobanner.png"
            />
            <div className="absolute inset-0 bg-linear-to-r from-white/92 via-white/65 to-white/15" />
            <div className="relative z-10 flex min-h-56 items-center p-5 sm:min-h-64 sm:p-7">
              <div className="max-w-xl">
                <Eyebrow>{t('studentLandingEyebrow')}</Eyebrow>
                <h1 className="mt-2 max-w-lg text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                  {t('studentLandingTitle')}
                </h1>
                <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                  {t('studentLandingSubtitle')}
                </p>
              </div>
            </div>
          </section>

          {error && <AlertMessage>{error}</AlertMessage>}

          {activeSession && (
            <Panel>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <Eyebrow>{t('continueCurrentSession')}</Eyebrow>
                  <h2 className="mt-1 wrap-break-word text-xl font-black text-slate-950">
                    {activeSession.title || t(activeSession.mode === 'MockExam' ? 'mockExam' : activeSession.mode === 'Practice' ? 'practice' : 'paperExam')}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {activeSession.answeredCount}/{activeSession.totalQuestions} {t('answered')}
                    {activeSession.remainingSeconds !== null ? ` — ${t('timeRemaining')}: ${formatRemaining(activeSession.remainingSeconds)}` : ''}
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
              profile.subjects.slice(0, 3).map((subject, index) => (
                <article
                  key={subject.id}
                  className="grid min-h-44 content-between rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm shadow-slate-200/70"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={theme.text.eyebrow}>
                        {t('subject')}
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-sm font-black text-indigo-700">
                        {index + 1}
                      </span>
                    </div>
                    <h2 className="mt-4 wrap-break-word text-xl font-black leading-7 text-slate-950">
                      {getAcademicName(subject, academicLanguage)}
                    </h2>
                  </div>
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
