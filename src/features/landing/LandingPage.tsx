import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { AppLogo } from '../../components/layout/AppLogo';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Eyebrow, Panel } from '../../components/ui/Layout';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { getSubjectPerformance, type SubjectPerformance } from '../../services/analyticsService';
import { getActiveSession } from '../../services/examService';
import type { StudentProfile, StudentSubject } from '../../types/academic';
import type { ActiveSession } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getExamModeLabelKey } from '../../utils/examMode';
import { getErrorMessage } from '../../utils/errors';

function formatRemaining(seconds: number | null) {
  if (seconds === null) return '';
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return `${minutes} min`;
}

const getStartedButtonClass =
  '!border-blue-600 !bg-blue-600 !text-white shadow-sm shadow-blue-900/10 hover:!border-blue-700 hover:!bg-blue-700';

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

const subjectVisuals: Record<string, { card: string; icon: string; accent: string; Icon: () => ReturnType<typeof SubjectIcon> }> = {
  accounting: {
    card: 'border-amber-200 bg-linear-to-br from-amber-50/95 via-white to-amber-100/85 shadow-amber-100/80',
    icon: 'bg-amber-100 text-amber-700',
    accent: 'bg-amber-500',
    Icon: createSubjectIcon('calculator'),
  },
  agriculturalScience: {
    card: 'border-lime-200 bg-linear-to-br from-lime-50/95 via-white to-lime-100/85 shadow-lime-100/80',
    icon: 'bg-lime-100 text-lime-700',
    accent: 'bg-lime-500',
    Icon: createSubjectIcon('sprout'),
  },
  art: {
    card: 'border-rose-200 bg-linear-to-br from-rose-50/95 via-white to-rose-100/85 shadow-rose-100/80',
    icon: 'bg-rose-100 text-rose-700',
    accent: 'bg-rose-500',
    Icon: createSubjectIcon('palette'),
  },
  biology: {
    card: 'border-emerald-200 bg-linear-to-br from-emerald-50/95 via-white to-emerald-100/85 shadow-emerald-100/80',
    icon: 'bg-emerald-100 text-emerald-700',
    accent: 'bg-emerald-500',
    Icon: createSubjectIcon('dna'),
  },
  bioSystemTechnology: {
    card: 'border-teal-200 bg-linear-to-br from-teal-50/95 via-white to-teal-100/85 shadow-teal-100/80',
    icon: 'bg-teal-100 text-teal-700',
    accent: 'bg-teal-500',
    Icon: createSubjectIcon('bioTech'),
  },
  businessStatistics: {
    card: 'border-cyan-200 bg-linear-to-br from-cyan-50/95 via-white to-cyan-100/85 shadow-cyan-100/80',
    icon: 'bg-cyan-100 text-cyan-700',
    accent: 'bg-cyan-500',
    Icon: createSubjectIcon('chart'),
  },
  businessStudies: {
    card: 'border-orange-200 bg-linear-to-br from-orange-50/95 via-white to-orange-100/85 shadow-orange-100/80',
    icon: 'bg-orange-100 text-orange-700',
    accent: 'bg-orange-500',
    Icon: createSubjectIcon('briefcase'),
  },
  chemistry: {
    card: 'border-purple-200 bg-linear-to-br from-purple-50/95 via-white to-purple-100/85 shadow-purple-100/80',
    icon: 'bg-purple-100 text-purple-700',
    accent: 'bg-purple-500',
    Icon: createSubjectIcon('flask'),
  },
  combinedMathematics: {
    card: 'border-indigo-200 bg-linear-to-br from-indigo-50/95 via-white to-indigo-100/85 shadow-indigo-100/80',
    icon: 'bg-indigo-100 text-indigo-700',
    accent: 'bg-indigo-500',
    Icon: createSubjectIcon('function'),
  },
  dramaAndTheatre: {
    card: 'border-pink-200 bg-linear-to-br from-pink-50/95 via-white to-pink-100/85 shadow-pink-100/80',
    icon: 'bg-pink-100 text-pink-700',
    accent: 'bg-pink-500',
    Icon: createSubjectIcon('masks'),
  },
  economics: {
    card: 'border-yellow-200 bg-linear-to-br from-yellow-50/95 via-white to-yellow-100/85 shadow-yellow-100/80',
    icon: 'bg-yellow-100 text-yellow-700',
    accent: 'bg-yellow-500',
    Icon: createSubjectIcon('coins'),
  },
  engineeringTechnology: {
    card: 'border-slate-200 bg-linear-to-br from-slate-50/95 via-white to-slate-100/85 shadow-slate-100/80',
    icon: 'bg-slate-200 text-slate-700',
    accent: 'bg-slate-500',
    Icon: createSubjectIcon('gear'),
  },
  english: {
    card: 'border-blue-200 bg-linear-to-br from-blue-50/95 via-white to-blue-100/85 shadow-blue-100/80',
    icon: 'bg-blue-100 text-blue-700',
    accent: 'bg-blue-500',
    Icon: createSubjectIcon('letter'),
  },
  geography: {
    card: 'border-green-200 bg-linear-to-br from-green-50/95 via-white to-green-100/85 shadow-green-100/80',
    icon: 'bg-green-100 text-green-700',
    accent: 'bg-green-500',
    Icon: createSubjectIcon('globe'),
  },
  history: {
    card: 'border-stone-200 bg-linear-to-br from-stone-50/95 via-white to-stone-100/85 shadow-stone-100/80',
    icon: 'bg-stone-200 text-stone-700',
    accent: 'bg-stone-500',
    Icon: createSubjectIcon('hourglass'),
  },
  homeEconomics: {
    card: 'border-red-200 bg-linear-to-br from-red-50/95 via-white to-red-100/85 shadow-red-100/80',
    icon: 'bg-red-100 text-red-700',
    accent: 'bg-red-500',
    Icon: createSubjectIcon('home'),
  },
  ict: {
    card: 'border-sky-200 bg-linear-to-br from-sky-50/95 via-white to-sky-100/85 shadow-sky-100/80',
    icon: 'bg-sky-100 text-sky-700',
    accent: 'bg-sky-500',
    Icon: createSubjectIcon('monitor'),
  },
  logicAndScientificMethod: {
    card: 'border-violet-200 bg-linear-to-br from-violet-50/95 via-white to-violet-100/85 shadow-violet-100/80',
    icon: 'bg-violet-100 text-violet-700',
    accent: 'bg-violet-500',
    Icon: createSubjectIcon('logic'),
  },
  massMediaAndCommunicationStudies: {
    card: 'border-fuchsia-200 bg-linear-to-br from-fuchsia-50/95 via-white to-fuchsia-100/85 shadow-fuchsia-100/80',
    icon: 'bg-fuchsia-100 text-fuchsia-700',
    accent: 'bg-fuchsia-500',
    Icon: createSubjectIcon('megaphone'),
  },
  music: {
    card: 'border-violet-300 bg-linear-to-br from-violet-100/95 via-white to-violet-200/70 shadow-violet-100/80',
    icon: 'bg-violet-200 text-violet-800',
    accent: 'bg-violet-600',
    Icon: createSubjectIcon('music'),
  },
  physics: {
    card: 'border-sky-200 bg-linear-to-br from-sky-50/95 via-white to-sky-100/85 shadow-sky-100/80',
    icon: 'bg-sky-100 text-sky-700',
    accent: 'bg-sky-500',
    Icon: createSubjectIcon('atom'),
  },
  politicalScience: {
    card: 'border-slate-300 bg-linear-to-br from-slate-100/95 via-white to-blue-100/75 shadow-slate-100/80',
    icon: 'bg-slate-200 text-slate-800',
    accent: 'bg-slate-700',
    Icon: createSubjectIcon('columns'),
  },
  scienceForTechnology: {
    card: 'border-blue-300 bg-linear-to-br from-blue-100/95 via-white to-cyan-100/75 shadow-blue-100/80',
    icon: 'bg-blue-100 text-cyan-700',
    accent: 'bg-cyan-600',
    Icon: createSubjectIcon('rocket'),
  },
  sinhala: {
    card: 'border-yellow-300 bg-linear-to-br from-yellow-100/95 via-white to-orange-100/75 shadow-yellow-100/80',
    icon: 'bg-yellow-100 text-orange-700',
    accent: 'bg-orange-600',
    Icon: createSubjectIcon('language'),
  },
  tamil: {
    card: 'border-rose-300 bg-linear-to-br from-rose-100/95 via-white to-red-100/75 shadow-rose-100/80',
    icon: 'bg-rose-100 text-red-700',
    accent: 'bg-red-600',
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
  return subjectVisuals[key] || subjectVisuals.english;
}

function formatPerformance(value: number) {
  return `${Math.round(value)}%`;
}

export function LandingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { auth, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const academicLanguage = mediumToLanguage(profile?.medium || 'English');
  const performanceBySubject = useMemo(
    () => new Map(subjectPerformance.map((item) => [item.subjectId, item])),
    [subjectPerformance],
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
      getActiveSession().catch(() => null),
      getSubjectPerformance().catch(() => []),
    ])
      .then(([data, activeSessionData, performanceData]) => {
        if (active) {
          setProfile(data);
          setActiveSession(activeSessionData);
          setSubjectPerformance(performanceData);
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
                    {activeSession.title || t(getExamModeLabelKey(activeSession.mode))}
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

          <section className="grid gap-3">
            {loading ? (
              <Panel className="text-sm font-bold text-slate-500 sm:col-span-3">
                {t('loading')}
              </Panel>
            ) : profile?.subjects.length ? (
              profile.subjects.slice(0, 3).map((subject) => {
                const visual = getSubjectVisual(subject);
                const Icon = visual.Icon;
                const performance = performanceBySubject.get(subject.id);
                const hasPerformance = Boolean(performance && performance.totalQuestionsAttempted > 0);
                const subjectOverall = performance?.readinessPercentage || 0;
                const subjectMetrics = [
                  { label: t('overall'), value: subjectOverall },
                  { label: t('coverage'), value: performance?.coveragePercentage || 0 },
                  { label: t('mastery'), value: performance?.masteryPercentage || 0 },
                  { label: t('accuracy'), value: performance?.accuracyPercentage || 0 },
                ];

                return (
                  <Link
                    key={subject.id}
                    aria-label={`${t('openSubject')}: ${getAcademicName(subject, academicLanguage)}`}
                    className={`relative block overflow-hidden rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${visual.card}`}
                    to={`/subject?subjectId=${encodeURIComponent(subject.id)}`}
                  >
                    <div className="relative z-10 grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
                      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4 sm:block">
                        <span className={`grid h-22 w-22 place-items-center rounded-3xl ${visual.icon}`}>
                          <Icon />
                        </span>
                        <div className="sm:hidden">
                          <h2 className="wrap-break-word text-2xl font-black leading-tight text-slate-950">
                            {getAcademicName(subject, academicLanguage)}
                          </h2>
                        </div>
                      </div>

                      <div className="min-w-0 sm:border-l sm:border-slate-300/70 sm:pl-6">
                        <h2 className="hidden wrap-break-word text-3xl font-black leading-tight text-slate-950 sm:block">
                          {getAcademicName(subject, academicLanguage)}
                        </h2>

                        <div className="mt-4 grid gap-2">
                          <div className="h-2.5 overflow-hidden rounded-full bg-white/90 shadow-inner">
                          <div
                            className={`h-full rounded-full ${visual.accent}`}
                            style={{ width: `${Math.min(Math.max(subjectOverall, 0), 100)}%` }}
                          />
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {subjectMetrics.map((metric) => (
                              <span className="rounded-lg bg-white/75 px-2 py-2 shadow-sm shadow-slate-200/40" key={metric.label}>
                                <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
                                  {metric.label}
                                </span>
                                <span className="mt-0.5 block text-sm font-black text-slate-950">
                                  {hasPerformance ? formatPerformance(metric.value) : '--'}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
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
