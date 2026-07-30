import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Eyebrow, PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { examProgressStorageKey, examSessionStorageKey, getActiveSession, startMockSession } from '../../services/examService';
import type { StudentProfile } from '../../types/academic';
import type { ActiveSession } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errors';

const mockQuestionCounts = [20, 30, 50];

function formatRemaining(seconds: number | null) {
  if (seconds === null) return '';
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return `${minutes} min`;
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
  const [mockQuestionCount, setMockQuestionCount] = useState(50);
  const [startingMock, setStartingMock] = useState(false);

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

  async function startMockExam() {
    setError('');
    setStartingMock(true);

    try {
      const mockBackPath = `/subject?subjectId=${encodeURIComponent(activeSubjectId)}`;
      const started = await startMockSession(activeSubjectId, mockQuestionCount);
      localStorage.removeItem(examProgressStorageKey(started.sessionId));
      localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
        session: started,
        clientStartedAt: Date.now(),
        paperTitle: selectedSubject?.name || t('mockExam'),
        backPath: mockBackPath,
      }));
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(mockBackPath)}`);
    } catch (startError) {
      setError(getErrorMessage(startError, 'Could not start mock exam.'));
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
                    {activeSession.title || t(activeSession.mode === 'MockExam' ? 'mockExam' : activeSession.mode === 'Practice' ? 'practice' : 'paperExam')}
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

          <Panel className="min-h-36 bg-white">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <Eyebrow>{t('topChoice')}</Eyebrow>
                <span className="mt-2 block text-2xl font-black text-slate-950">{t('mockExams')}</span>
                <span className="mt-2 block max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  {t('mockExamCardText')}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-[140px_180px]">
                <label className="grid gap-1">
                  <span className="text-sm font-black text-slate-700">{t('questionLimit')}</span>
                  <select
                    className={theme.control.select}
                    onChange={(event) => setMockQuestionCount(Number(event.target.value))}
                    value={mockQuestionCount}
                  >
                    {mockQuestionCounts.map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </label>
                <Button
                  className="self-end"
                  disabled={startingMock}
                  onClick={() => void startMockExam()}
                  type="button"
                >
                  {startingMock ? t('loading') : t('startMockExam')}
                </Button>
              </div>
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink
              className="h-auto min-h-28 flex-col items-start justify-start text-left"
              to={`${paperPath}&type=PastPaper`}
              variant="secondary"
            >
              <span className="block text-lg font-black text-slate-950">{t('pastPapers')}</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500">
                {t('pastPapersHubText')}
              </span>
            </ButtonLink>

            <ButtonLink
              className="h-auto min-h-28 flex-col items-start justify-start text-left"
              to={`${paperPath}&type=ModelPaper`}
              variant="secondary"
            >
              <span className="block text-lg font-black text-slate-950">{t('modelPapers')}</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500">
                {t('modelPapersHubText')}
              </span>
            </ButtonLink>

            <ButtonLink
              className="h-auto min-h-28 flex-col items-start justify-start text-left"
              to={`/topics?subjectId=${encodeURIComponent(subjectId)}`}
              variant="secondary"
            >
              <span className="block text-lg font-black text-slate-950">{t('topicWiseQuestions')}</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500">
                {t('topicWiseQuestionsHubText')}
              </span>
            </ButtonLink>

            <ButtonLink
              className="h-auto min-h-28 flex-col items-start justify-start text-left"
              to={`/progress?subjectId=${encodeURIComponent(subjectId)}`}
              variant="secondary"
            >
              <span className="block text-lg font-black text-slate-950">{t('progress')}</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500">
                {t('progressHubText')}
              </span>
            </ButtonLink>

          </div>
        </section>
        <LoadingOverlay label={t('startingExam')} open={startingMock} />
    </PageShell>
  );
}
