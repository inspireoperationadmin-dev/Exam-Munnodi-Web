import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { InfoDialog } from '../../components/ui/InfoDialog';
import { Eyebrow, PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { examProgressStorageKey, examSessionStorageKey, getActiveSession, startMockSession } from '../../services/examService';
import type { StudentProfile } from '../../types/academic';
import type { ActiveSession } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getExamModeLabelKey } from '../../utils/examMode';
import { getErrorMessage } from '../../utils/errors';
import { launchQuestionCount } from '../../config/exam';

type HubIconName = 'paper' | 'model' | 'topic' | 'progress';

function formatRemaining(seconds: number | null) {
  if (seconds === null) return '';
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return `${minutes} min`;
}

function isLowQuestionMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("doesn't have enough questions")
    || normalized.includes('not enough questions')
    || normalized.includes('no questions available');
}

function HubIcon({ name }: { name: HubIconName }) {
  if (name === 'topic') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="M7 5h4v4H7V5Zm6 0h4v4h-4V5ZM7 15h4v4H7v-4Zm6 0h4v4h-4v-4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M11 7h2M9 9v6m6-6v6m-4 2h2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === 'progress') {
    return (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="M5 19V5m0 14h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M8 15l3-3 3 2 4-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M7 4h7l3 3v13H7V4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M14 4v4h4M10 12h5M10 16h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function SubjectActionLink({
  icon,
  kicker,
  text,
  title,
  to,
  variant = 'default',
}: {
  icon: HubIconName;
  kicker?: string;
  text: string;
  title: string;
  to: string;
  variant?: 'default' | 'wide' | 'progress';
}) {
  const isWide = variant !== 'default';
  const tone = variant === 'progress'
    ? 'border-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/80 text-emerald-700 shadow-emerald-100/70'
    : 'border-indigo-100 bg-linear-to-br from-white via-white to-purple-50/80 text-indigo-700 shadow-slate-200/70';

  return (
    <Link
      className={`relative grid min-h-34 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-5 ${tone} ${isWide ? 'col-span-2' : ''}`}
      to={to}
    >
      <span aria-hidden="true" className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-purple-200/35 blur-xl" />
      <span className={`relative z-10 grid items-start gap-4 ${isWide ? 'grid-cols-[48px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-sm shadow-slate-200/60">
          <HubIcon name={icon} />
        </span>
        <span className="min-w-0">
          {kicker && (
            <span className="mb-1 block text-sm font-black leading-5 text-slate-800">
              {kicker}
            </span>
          )}
          <span className={`block wrap-break-word font-black text-slate-950 ${isWide ? 'text-xl leading-7' : 'text-lg leading-6 sm:text-xl sm:leading-7'}`}>
            {title}
          </span>
          <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">
            {text}
          </span>
        </span>
      </span>
    </Link>
  );
}

export function SubjectHubPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [startingMock, setStartingMock] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const academicLanguage = mediumToLanguage(profile?.medium || 'English');

  useEffect(() => {
    let active = true;
    setError('');

    Promise.all([
      getStudentProfile(),
      subjectId ? getActiveSession(subjectId).catch(() => null) : Promise.resolve(null),
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

    return () => {
      active = false;
    };
  }, [subjectId, t]);

  if (!subjectId) {
    return <Navigate to="/" replace />;
  }

  const activeSubjectId = subjectId;
  const paperPath = `/papers?subjectId=${encodeURIComponent(activeSubjectId)}`;
  const selectedSubject = profile?.subjects.find((subject) => subject.id === activeSubjectId);
  const selectedSubjectName = selectedSubject ? getAcademicName(selectedSubject, academicLanguage) : '';

  async function startMockExam() {
    setError('');
    setStartingMock(true);

    try {
      const mockBackPath = `/subject?subjectId=${encodeURIComponent(activeSubjectId)}`;
      const started = await startMockSession(activeSubjectId, launchQuestionCount);
      localStorage.removeItem(examProgressStorageKey(started.sessionId));
      localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
        session: started,
        clientStartedAt: Date.now(),
        paperTitle: selectedSubjectName || t('mockExam'),
        backPath: mockBackPath,
      }));
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(mockBackPath)}`);
    } catch (startError) {
      const message = getErrorMessage(startError, t('mockNotEnoughQuestions'));
      if (isLowQuestionMessage(message)) {
        setNoticeMessage(message);
      } else {
        setError(message);
      }
    } finally {
      setStartingMock(false);
    }
  }

  return (
    <PageShell>
        <PageHeader>
          <Link
            className={theme.link.subtleButton}
            to="/"
          >
            {t('backToHome')}
          </Link>
          <ProfileAvatar name={profile?.fullName} email={auth?.email} />
        </PageHeader>


        {error && <AlertMessage>{error}</AlertMessage>}

        <section className="grid gap-3">
          {activeSession && (
            <Panel className="bg-white">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <Eyebrow>{t('continueCurrentSession')}</Eyebrow>
                  <span className="mt-1 block break-words text-xl font-black text-slate-950">
                    {activeSession.title || t(getExamModeLabelKey(activeSession.mode))}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-slate-500">
                    {activeSession.answeredCount}/{activeSession.totalQuestions} {t('answered')}
                    {activeSession.remainingSeconds !== null ? ` · ${t('timeRemaining')}: ${formatRemaining(activeSession.remainingSeconds)}` : ''}
                  </span>
                </div>
                <Button
                  onClick={() => navigate(`/exam?sessionId=${encodeURIComponent(activeSession.sessionId)}&backPath=${encodeURIComponent(`/subject?subjectId=${activeSubjectId}`)}`)}
                  type="button"
                >
                  {t('resumeSession')}
                </Button>
              </div>
            </Panel>
          )}

          <Panel className="overflow-hidden border-indigo-200 bg-linear-to-br from-indigo-100 via-white to-purple-100 text-slate-950 shadow-md shadow-indigo-100/80">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
              <div className="min-w-0">
                <span className="inline-flex rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                  {t('recommended')}
                </span>
                <span className="mt-3 block text-2xl font-black text-slate-950 sm:text-3xl">{t('smartMockExam')}</span>
                <span className="mt-2 block max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                  {t('mockExamCardText')}
                </span>
              </div>
              <div className="grid">
                <Button
                  className="w-full border-emerald-700 bg-emerald-700 text-white hover:border-emerald-800 hover:bg-emerald-800"
                  disabled={startingMock}
                  onClick={() => void startMockExam()}
                  type="button"
                >
                  {startingMock ? t('loading') : t('startMockExam')}
                </Button>
              </div>
            </div>
          </Panel>

          <div>
            <h2 className="px-1 text-sm font-black uppercase tracking-wide text-slate-500">
              {t('studyLibrary')}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
            <SubjectActionLink
              icon="paper"
              text={t('pastPapersHubText')}
              title={t('pastPapers')}
              to={`${paperPath}&type=PastPaper`}
            />

            <SubjectActionLink
              icon="model"
              text={t('modelPapersHubText')}
              title={t('modelPapers')}
              to={`${paperPath}&type=ModelPaper`}
            />

            <SubjectActionLink
              icon="topic"
              text={t('topicWiseQuestionsHubText')}
              title={t('topicWiseQuestions')}
              to={`/topics?subjectId=${encodeURIComponent(subjectId)}`}
              variant="wide"
            />

            <SubjectActionLink
              icon="progress"
              kicker={undefined}
              text={t('progressHubText')}
              title={t('performance')}
              to={`/progress?subjectId=${encodeURIComponent(subjectId)}`}
              variant="progress"
            />

            </div>
          </div>
        </section>
        <LoadingOverlay label={t('startingExam')} open={startingMock} />
        <InfoDialog
          closeLabel={t('close')}
          message={noticeMessage}
          onClose={() => setNoticeMessage('')}
          open={Boolean(noticeMessage)}
          title={t('examNotReadyTitle')}
        />
    </PageShell>
  );
}
