import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Check, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { AppLogo } from '../../components/layout/AppLogo';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { ButtonLink } from '../../components/ui/Button';
import { InfoDialog } from '../../components/ui/InfoDialog';
import { Panel } from '../../components/ui/Layout';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { getStudentProgressSummary, type StudentProgressSummary } from '../../services/analyticsService';
import { getExamSessions } from '../../services/examService';
import { getLaunchOfferStatus } from '../../services/subscriptionService';
import type { StudentProfile, StudentSubject } from '../../types/academic';
import type { ExamSessionSummary } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';
import { launchMockTimeLimitMinutes, launchQuestionCount } from '../../config/exam';
import { QuickExamSheet } from '../exam/QuickExamSheet';
import { startStoredMockExam } from '../exam/startStoredMockExam';
import { ResumeSessionsPanel } from '../resume/ResumeSessionsPanel';
import { filterResumableSessions } from '../resume/resumeSessionUtils';
import { readActiveSubject, writeActiveSubject } from '../subjects/activeSubject';
import { useSubscription } from '../subscription/SubscriptionContext';

type SubjectIconType =
  | 'calculator' | 'sprout' | 'palette' | 'dna' | 'bioTech' | 'chart' | 'briefcase' | 'flask'
  | 'function' | 'masks' | 'coins' | 'gear' | 'letter' | 'globe' | 'hourglass' | 'home'
  | 'monitor' | 'logic' | 'megaphone' | 'music' | 'atom' | 'columns' | 'rocket' | 'language' | 'pen';

function SubjectIcon({ type }: { type: SubjectIconType }) {
  const common = {
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2.4,
  };

  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 32 32">
      {type === 'calculator' && (
        <>
          <rect height="22" rx="3" width="18" x="7" y="5" {...common} />
          <path d="M11 10h10M11 16h2M16 16h2M21 16h0M11 21h2M16 21h2M21 21h0" {...common} />
        </>
      )}
      {type === 'sprout' && (
        <>
          <path d="M16 27V10M16 13c-5-5-10-4-12 1 4 3 8 2 12-1ZM16 18c5-5 10-4 12 1-4 3-8 2-12-1ZM8 27h16" {...common} />
        </>
      )}
      {type === 'palette' && (
        <>
          <path d="M16 5C9.4 5 5 9.2 5 15.4 5 21.9 10 27 16.2 27h2.2c2.1 0 2.8-2.7 1.1-3.9-.9-.6-.4-2.1.7-2.1H23c2.4 0 4-1.7 4-4.2C27 10.2 22.6 5 16 5Z" {...common} />
          <path d="M11 14h.1M15 11h.1M20 13h.1M12.5 19h.1" {...common} />
        </>
      )}
      {type === 'dna' && (
        <>
          <path d="M10 5c8 4 4 18 12 22M22 5c-8 4-4 18-12 22M12 10h8M11 16h10M12 22h8" {...common} />
        </>
      )}
      {type === 'bioTech' && (
        <>
          <path d="M10 6c8 4 4 16 12 20M22 6c-8 4-4 16-12 20M12 12h8M12 20h8" {...common} />
          <circle cx="23.5" cy="16" r="3.5" {...common} />
          <path d="M23.5 10.5v2M23.5 19.5v2M18 16h2M27 16h2" {...common} />
        </>
      )}
      {type === 'chart' && (
        <>
          <path d="M6 25h20M10 21v-6M16 21V9M22 21v-9" {...common} />
          <path d="M8 10l5 4 5-6 6 3" {...common} />
        </>
      )}
      {type === 'briefcase' && (
        <>
          <rect height="16" rx="3" width="24" x="4" y="10" {...common} />
          <path d="M12 10V7h8v3M4 16h24M14 16v2h4v-2" {...common} />
        </>
      )}
      {type === 'flask' && (
        <>
          <path d="M12 5h8M14 5v7L7 24c-.9 1.5.2 3 1.9 3h14.2c1.7 0 2.8-1.5 1.9-3l-7-12V5M10 22h12" {...common} />
        </>
      )}
      {type === 'function' && (
        <>
          <path d="M8 25c4 0 4-18 8-18M12 15h8M18 11l6 8M24 11l-6 8" {...common} />
        </>
      )}
      {type === 'masks' && (
        <>
          <path d="M6 9c5-2 9-1 12 2-1 8-4 12-8 12-3 0-5-4-4-14Z" {...common} />
          <path d="M14 10c4-3 8-3 12-1 1 10-1 14-4 14-2 0-4-2-5-5M9 15h.1M14 15h.1M9 20c2 1 4 1 6 0M20 14h.1M24 14h.1" {...common} />
        </>
      )}
      {type === 'coins' && (
        <>
          <ellipse cx="16" cy="8" rx="8" ry="3" {...common} />
          <path d="M8 8v10c0 1.7 3.6 3 8 3s8-1.3 8-3V8M8 13c0 1.7 3.6 3 8 3s8-1.3 8-3M8 18c0 1.7 3.6 3 8 3s8-1.3 8-3" {...common} />
        </>
      )}
      {type === 'gear' && (
        <>
          <circle cx="16" cy="16" r="4" {...common} />
          <path d="M16 5v3M16 24v3M5 16h3M24 16h3M8.2 8.2l2.1 2.1M21.7 21.7l2.1 2.1M23.8 8.2l-2.1 2.1M10.3 21.7l-2.1 2.1" {...common} />
        </>
      )}
      {type === 'letter' && (
        <>
          <path d="M7 25 16 6l9 19M10 19h12" {...common} />
          <path d="M8 7h16" {...common} />
        </>
      )}
      {type === 'globe' && (
        <>
          <circle cx="16" cy="16" r="11" {...common} />
          <path d="M5 16h22M16 5c3 3 4.5 7 4.5 11S19 24 16 27M16 5c-3 3-4.5 7-4.5 11S13 24 16 27" {...common} />
        </>
      )}
      {type === 'hourglass' && (
        <>
          <path d="M10 5h12M10 27h12M11 5c0 7 10 7 10 14 0 3-2 5-5 8M21 5c0 7-10 7-10 14 0 3 2 5 5 8" {...common} />
        </>
      )}
      {type === 'home' && (
        <>
          <path d="M5 15 16 6l11 9M8 14v12h16V14M12 26v-7h8v7" {...common} />
          <path d="M12 11c2 2 6 2 8 0" {...common} />
        </>
      )}
      {type === 'monitor' && (
        <>
          <rect height="16" rx="2" width="24" x="4" y="6" {...common} />
          <path d="M12 26h8M16 22v4M13 12l-3 3 3 3M19 12l3 3-3 3" {...common} />
        </>
      )}
      {type === 'logic' && (
        <>
          <circle cx="10" cy="10" r="3" {...common} />
          <circle cx="22" cy="10" r="3" {...common} />
          <circle cx="16" cy="23" r="3" {...common} />
          <path d="M13 10h6M11.5 12.5 14.5 20.5M20.5 12.5 17.5 20.5" {...common} />
        </>
      )}
      {type === 'megaphone' && (
        <>
          <path d="M6 18h5l13 6V8L11 14H6v4ZM11 18l2 7" {...common} />
        </>
      )}
      {type === 'music' && (
        <>
          <path d="M20 7v14M20 7l7-2v14M13 22a4 3 0 1 1-8 0 4 3 0 0 1 8 0ZM28 20a4 3 0 1 1-8 0 4 3 0 0 1 8 0Z" {...common} />
        </>
      )}
      {type === 'atom' && (
        <>
          <circle cx="16" cy="16" fill="currentColor" r="2.5" />
          <ellipse cx="16" cy="16" rx="12" ry="5" {...common} />
          <ellipse cx="16" cy="16" rx="12" ry="5" transform="rotate(60 16 16)" {...common} />
          <ellipse cx="16" cy="16" rx="12" ry="5" transform="rotate(120 16 16)" {...common} />
        </>
      )}
      {type === 'columns' && (
        <>
          <path d="M6 11h20L16 5 6 11ZM8 25h16M10 12v11M16 12v11M22 12v11" {...common} />
        </>
      )}
      {type === 'rocket' && (
        <>
          <path d="M16 21c6-3 9-8 9-16-8 0-13 3-16 9l-4 1 4 3 5 5 3 4 1-4Z" {...common} />
          <circle cx="19" cy="11" r="2" {...common} />
          <path d="M8 24c-1 2-3 3-5 3 0-2 1-4 3-5" {...common} />
        </>
      )}
      {type === 'language' && (
        <>
          <path d="M6 8h12M12 8c0 7-2 12-7 16M9 14c2 4 5 7 9 9M18 26l5-14 5 14M20 21h6" {...common} />
        </>
      )}
      {type === 'pen' && (
        <>
          <path d="M7 25l4-1 14-14-3-3L8 21l-1 4ZM19 10l3 3" {...common} />
          <path d="M6 27h20" {...common} />
        </>
      )}
    </svg>
  );
}

function createSubjectIcon(type: SubjectIconType) {
  return function Icon() {
    return <SubjectIcon type={type} />;
  };
}

const subjectVisuals: Record<string, { Icon: () => ReturnType<typeof SubjectIcon> }> = {
  accounting: {
    Icon: createSubjectIcon('calculator'),
  },
  agriculturalScience: {
    Icon: createSubjectIcon('sprout'),
  },
  art: {
    Icon: createSubjectIcon('palette'),
  },
  biology: {
    Icon: createSubjectIcon('dna'),
  },
  bioSystemTechnology: {
    Icon: createSubjectIcon('bioTech'),
  },
  businessStatistics: {
    Icon: createSubjectIcon('chart'),
  },
  businessStudies: {
    Icon: createSubjectIcon('briefcase'),
  },
  chemistry: {
    Icon: createSubjectIcon('flask'),
  },
  combinedMathematics: {
    Icon: createSubjectIcon('function'),
  },
  dramaAndTheatre: {
    Icon: createSubjectIcon('masks'),
  },
  economics: {
    Icon: createSubjectIcon('coins'),
  },
  engineeringTechnology: {
    Icon: createSubjectIcon('gear'),
  },
  english: {
    Icon: createSubjectIcon('letter'),
  },
  geography: {
    Icon: createSubjectIcon('globe'),
  },
  history: {
    Icon: createSubjectIcon('hourglass'),
  },
  homeEconomics: {
    Icon: createSubjectIcon('home'),
  },
  ict: {
    Icon: createSubjectIcon('monitor'),
  },
  logicAndScientificMethod: {
    Icon: createSubjectIcon('logic'),
  },
  massMediaAndCommunicationStudies: {
    Icon: createSubjectIcon('megaphone'),
  },
  music: {
    Icon: createSubjectIcon('music'),
  },
  physics: {
    Icon: createSubjectIcon('atom'),
  },
  politicalScience: {
    Icon: createSubjectIcon('columns'),
  },
  scienceForTechnology: {
    Icon: createSubjectIcon('rocket'),
  },
  sinhala: {
    Icon: createSubjectIcon('language'),
  },
  tamil: {
    Icon: createSubjectIcon('pen'),
  },
};

function getSubjectVisualKey(subjectName: string) {
  return subjectName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+(.)/g, (_, character: string) => character.toUpperCase())
    .replace(/^[A-Z]/, (character) => character.toLowerCase());
}

function getSubjectVisual(subject: StudentSubject) {
  const key = getSubjectVisualKey(`${subject.nameEnglish || subject.name}`);
  const visual = subjectVisuals[key] || subjectVisuals.english;
  return {
    ...visual,
    icon: 'bg-[var(--sf-surface-muted)] text-[var(--sf-brand)]',
  };
}

function formatPerformance(value: number) {
  return `${Math.round(value)}%`;
}

type LandingTranslator = ReturnType<typeof useLanguage>['t'];

function PublicLanding({ t }: { t: LandingTranslator }) {
  return (
    <main className={theme.shell.main}>
      <section
        aria-labelledby="public-landing-title"
        className="relative isolate min-h-screen min-h-dvh overflow-hidden bg-[var(--sf-hero-background)]"
      >
        <img
          alt="A Sri Lankan A/L student studying Biology, Chemistry, and Physics"
          className="absolute inset-0 h-full w-full object-cover object-[center_45%] sm:object-center"
          fetchPriority="high"
          src="/images/herobanner.png"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[image:var(--sf-landing-hero-overlay)]" />

        <div className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-6">
          <img
            alt=""
            className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
            src="/EM_DARK.png"
          />
          <h1 className="text-lg font-black text-[var(--sf-hero-on)] sm:text-2xl" id="public-landing-title">
            {t('brandName')}
          </h1>
        </div>

        <div className="relative z-10 flex min-h-screen min-h-dvh items-start justify-center px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[38dvh] sm:items-center sm:px-6 sm:pb-10 sm:pt-20">
          <div className="w-full max-w-xl text-center">
            <p className="text-3xl font-black leading-tight text-[var(--sf-hero-on)] sm:text-5xl">
              {t('landingHeroTagline')}
            </p>

            <ul className="mx-auto mt-5 grid max-w-sm gap-2 text-left text-sm font-semibold text-[var(--sf-hero-on-muted)] sm:mt-6 sm:text-base">
              {[
                t('landingHeroBulletPapers'),
                t('landingHeroBulletExams'),
                t('landingHeroBulletProgress'),
              ].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--sf-hero-button)] text-[var(--sf-hero-on)]">
                    <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 sm:mt-8">
              <ButtonLink className="w-full" size="lg" to="/register" variant="primary">
                {t('createAccount')}
              </ButtonLink>
              <ButtonLink className="w-full border-[var(--sf-hero-button-border)] bg-[var(--sf-hero-button)] text-[var(--sf-hero-on)] hover:bg-[var(--sf-hero-button-hover)]" size="lg" to="/login" variant="secondary">
                {t('signIn')}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function LandingPage() {
  const { t } = useLanguage();
  const { auth, isAuthenticated } = useAuth();
  const { recordUsage, status: subscription } = useSubscription();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumableSessions, setResumableSessions] = useState<ExamSessionSummary[]>([]);
  const [progressSummary, setProgressSummary] = useState<StudentProgressSummary | null>(null);
  const [launchOfferEligible, setLaunchOfferEligible] = useState(false);
  const [masteryInfoOpen, setMasteryInfoOpen] = useState(false);
  const [quickExamOpen, setQuickExamOpen] = useState(false);
  const [startingQuickExam, setStartingQuickExam] = useState(false);
  const [quickExamError, setQuickExamError] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => readActiveSubject(auth?.userId));
  const academicLanguage = mediumToLanguage(profile?.medium || 'English');
  const selectedSubject = useMemo(
    () => profile?.subjects.find((subject) => subject.id === selectedSubjectId) || profile?.subjects[0] || null,
    [profile?.subjects, selectedSubjectId],
  );
  const selectedSubjectProgress = useMemo(
    () => progressSummary?.subjects.find((item) => item.subjectId === selectedSubject?.id) || null,
    [progressSummary?.subjects, selectedSubject?.id],
  );
  const selectedResumableSessions = useMemo(
    () => selectedSubject
      ? resumableSessions.filter((session) => session.subjectId === selectedSubject.id)
      : [],
    [resumableSessions, selectedSubject],
  );

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
      getExamSessions().then(filterResumableSessions).catch(() => []),
      getStudentProgressSummary().catch(() => null),
      getLaunchOfferStatus().catch(() => null),
    ])
      .then(([data, resumableSessionData, progressData, launchOffer]) => {
        if (active) {
          setProfile(data);
          setResumableSessions(resumableSessionData);
          setProgressSummary(progressData);
          setLaunchOfferEligible(Boolean(launchOffer?.isEligible));

          const storedSubjectId = readActiveSubject(auth?.userId);
          const nextSubjectId = data.subjects.some((subject) => subject.id === storedSubjectId)
            ? storedSubjectId
            : data.subjects[0]?.id || '';
          setSelectedSubjectId(nextSubjectId);
          if (auth?.userId && nextSubjectId) {
            writeActiveSubject(auth.userId, nextSubjectId);
          }
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
  }, [auth?.isEmailVerified, auth?.isProfileSetup, auth?.userId, isAuthenticated, t]);

  if (isAuthenticated && auth && !auth.isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (isAuthenticated && auth && !auth.isProfileSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (!isAuthenticated) {
    return <PublicLanding t={t} />;
  }

  // ── Authenticated landing ──
  const mastery = Math.min(Math.max(selectedSubjectProgress?.masteryPercentage || 0, 0), 100);
  const selectedVisual = selectedSubject ? getSubjectVisual(selectedSubject) : null;

  function changeSubject(subjectId: string) {
    setSelectedSubjectId(subjectId);
    setQuickExamOpen(false);
    setQuickExamError('');
    if (auth?.userId) {
      writeActiveSubject(auth.userId, subjectId);
    }
  }

  const mockLimitReached = subscription?.monthlyMockExamLimit !== null
    && subscription?.monthlyMockExamLimit !== undefined
    && subscription.mockExamsUsed >= subscription.monthlyMockExamLimit;

  async function startQuickExam() {
    if (!selectedSubject || startingQuickExam || mockLimitReached) return;

    setQuickExamError('');
    setStartingQuickExam(true);
    try {
      const backPath = '/';
      const started = await startStoredMockExam({
        backPath,
        questionCount: launchQuestionCount,
        subjectId: selectedSubject.id,
        title: `${getAcademicName(selectedSubject, academicLanguage)} ${t('quickExam')}`,
      });
      recordUsage('mock');
      setQuickExamOpen(false);
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(backPath)}`);
    } catch (startError) {
      setQuickExamError(getErrorMessage(startError, t('mockNotEnoughQuestions')));
    } finally {
      setStartingQuickExam(false);
    }
  }

  return (
    <main className={theme.shell.main}>
      <section className={`${theme.shell.centered} ${theme.width.lg}`}>
        <header className="flex min-h-16 items-center justify-between gap-3">
          <AppLogo className="min-w-0 max-w-[52%]" label={t('brandName')} />
          <div className="min-w-0 max-w-[48%] sm:max-w-xs">
            <label className="sr-only" htmlFor="home-subject-selector">{t('subject')}</label>
            <select
              aria-label={t('subject')}
              className={`${theme.control.select} w-full min-w-0 truncate`}
              disabled={loading || !profile?.subjects.length}
              id="home-subject-selector"
              onChange={(event) => changeSubject(event.target.value)}
              value={selectedSubject?.id || ''}
            >
              {(profile?.subjects || []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {getAcademicName(subject, academicLanguage)}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid flex-1 content-start gap-4 py-4 sm:py-6">
          {error && <AlertMessage>{error}</AlertMessage>}

          {loading ? (
            <Panel className={theme.panel.loading}>{t('loading')}</Panel>
          ) : selectedSubject && selectedVisual ? (
            <section
              aria-labelledby="home-subject-mastery-title"
              className="relative overflow-hidden rounded-2xl border border-[var(--sf-mastery-border)] bg-[image:var(--sf-mastery-surface)] p-5 text-[var(--sf-mastery-on)] shadow-[var(--sf-shadow-lg)] sm:p-7"
            >
              <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[var(--sf-mastery-divider)]" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-[var(--sf-mastery-on-muted)]">{t('subjectMastery')}</p>
                  <h1 className="mt-2 truncate text-2xl font-black text-[var(--sf-mastery-on)] sm:text-3xl" id="home-subject-mastery-title">
                    {getAcademicName(selectedSubject, academicLanguage)}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[var(--sf-mastery-on-muted)]">
                    {t('masterySupportText')}
                  </p>
                </div>
                <button
                  aria-label={t('masteryCalculationTitle')}
                  className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--sf-mastery-divider)] bg-[var(--sf-mastery-glass)] text-base font-black text-[var(--sf-mastery-on)] transition hover:bg-[var(--sf-mastery-glass-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mastery-focus)]"
                  onClick={() => setMasteryInfoOpen(true)}
                  type="button"
                >
                  ?
                </button>
              </div>

              <div className="relative mt-6 grid items-center gap-6 sm:grid-cols-[190px_minmax(0,1fr)]">
                <div
                  aria-label={`${t('subjectMastery')}: ${formatPerformance(mastery)}`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(mastery)}
                  className="relative mx-auto grid h-44 w-44 shrink-0 place-items-center rounded-full p-2 shadow-[0_0_30px_var(--sf-mastery-divider)]"
                  role="progressbar"
                  style={{
                    background: `conic-gradient(var(--sf-mastery-ring) ${mastery * 3.6}deg, var(--sf-mastery-ring-track) 0deg)`,
                  }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full border border-[var(--sf-mastery-divider)] bg-[var(--sf-mastery-ring-center)] text-center">
                    <div>
                      <strong className="block text-4xl font-black tabular-nums text-[var(--sf-mastery-on)]">{formatPerformance(mastery)}</strong>
                      <span className="mt-1 block text-xs font-bold text-[var(--sf-mastery-on-muted)]">{t('mastery')}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 border-[var(--sf-mastery-divider)] sm:border-l sm:pl-6">
                  {[
                    [Target, t('masteryBenefitCoverage')],
                    [TrendingUp, t('masteryBenefitConsistency')],
                    [Trophy, t('masteryBenefitResults')],
                  ].map(([Icon, label]) => (
                    <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3" key={label as string}>
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--sf-mastery-glass)]">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-bold leading-5 text-[var(--sf-mastery-on)]">{label as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="relative mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--sf-mastery-divider)] bg-[image:var(--sf-mastery-action)] px-5 py-3 text-sm font-black text-[var(--sf-mastery-action-on)] shadow-[var(--sf-shadow-md)] transition hover:bg-[image:var(--sf-mastery-action-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mastery-focus)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  setQuickExamError('');
                  setQuickExamOpen(true);
                }}
                type="button"
              >
                <Zap aria-hidden="true" className="h-5 w-5" />
                {t('quickExam')}
              </button>
            </section>
          ) : (
            <div className={theme.card.dashed}>
              <h1 className="text-lg font-black text-[var(--sf-text)]">{t('noSubjects')}</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{t('profileRequired')}</p>
            </div>
          )}

          <ResumeSessionsPanel
            backPath="/"
            sessions={selectedResumableSessions}
            showAll
            showEmptyState
            subjectId={selectedSubject?.id}
            subjectScoped
          />

          {launchOfferEligible && (
            <section className="grid gap-4 rounded-xl border border-[var(--sf-primary)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
              <div>
                <p className={theme.text.eyebrow}>{t('launchOffer')}</p>
                <h2 className="mt-1 text-xl font-black text-[var(--sf-text)]">{t('claimBasicMonth')}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{t('claimBasicMonthText')}</p>
              </div>
              <ButtonLink to="/subscription" variant="primary">{t('claimFreeMonth')}</ButtonLink>
            </section>
          )}
        </div>
      </section>
      <InfoDialog
        closeLabel={t('close')}
        message={t('masteryCalculationText')}
        onClose={() => setMasteryInfoOpen(false)}
        open={masteryInfoOpen}
        title={t('masteryCalculationTitle')}
      />
      <QuickExamSheet
        error={quickExamError}
        limitReached={mockLimitReached}
        onClose={() => {
          if (!startingQuickExam) setQuickExamOpen(false);
        }}
        onStart={() => void startQuickExam()}
        open={quickExamOpen}
        questionCount={launchQuestionCount}
        starting={startingQuickExam}
        subjectName={selectedSubject ? getAcademicName(selectedSubject, academicLanguage) : ''}
        timeMinutes={launchMockTimeLimitMinutes}
      />
    </main>
  );
}
