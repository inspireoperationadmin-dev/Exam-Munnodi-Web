import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { EmptyState, Eyebrow, LoadingPanel, PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile, getTopics } from '../../services/academicService';
import { getSubTopicPerformance, type SubTopicPerformance } from '../../services/analyticsService';
import { examProgressStorageKey, examSessionStorageKey, startTopicSession } from '../../services/examService';
import type { PaperMedium, StudentProfile, TopicWithSubTopics } from '../../types/academic';
import type { ExamMode } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';
import { useAuth } from '../auth/AuthContext';

const limits = [10, 20, 30];

export function TopicListPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [topics, setTopics] = useState<TopicWithSubTopics[]>([]);
  const [subTopicPerformance, setSubTopicPerformance] = useState<SubTopicPerformance[]>([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingTopicKey, setStartingTopicKey] = useState('');

  useEffect(() => {
    if (!subjectId) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([getStudentProfile(), getTopics(subjectId), getSubTopicPerformance(subjectId)])
      .then(([studentProfile, topicList, performanceList]) => {
        if (!active) return;
        setProfile(studentProfile);
        setTopics([...topicList].sort((a, b) => a.orderIndex - b.orderIndex));
        setSubTopicPerformance(performanceList);
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('topicsLoadError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [subjectId, t]);

  const academicLanguage = useMemo(
    () => mediumToLanguage((profile?.medium || 'English') as PaperMedium),
    [profile?.medium],
  );
  const selectedSubject = profile?.subjects.find((subject) => subject.id === subjectId);
  const backPath = subjectId ? `/subject?subjectId=${encodeURIComponent(subjectId)}` : '/';
  const performanceBySubTopic = useMemo(
    () => new Map(subTopicPerformance.map((item) => [item.subTopicId, item])),
    [subTopicPerformance],
  );

  if (!subjectId) {
    return <Navigate to="/" replace />;
  }

  const activeSubjectId = subjectId;

  async function startTopic(topic: TopicWithSubTopics, mode: Extract<ExamMode, 'Practice' | 'FixedExam'>) {
    setError('');
    setStartingTopicKey(`${topic.id}-${mode}`);

    try {
      const topicBackPath = `/topics?subjectId=${encodeURIComponent(activeSubjectId)}`;
      const started = await startTopicSession(topic.id, limit, mode);
      localStorage.removeItem(examProgressStorageKey(started.sessionId));
      localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
        session: started,
        clientStartedAt: Date.now(),
        paperTitle: getAcademicName(topic, academicLanguage),
        backPath: topicBackPath,
      }));
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(topicBackPath)}`);
    } catch (startError) {
      setError(getErrorMessage(startError, 'Could not start this topic session.'));
    } finally {
      setStartingTopicKey('');
    }
  }

  return (
    <PageShell>
        <PageHeader>
          <Link
            className={theme.link.subtleButton}
            to={backPath}
          >
            {t('backToSubject')}
          </Link>
          <ProfileAvatar name={profile?.fullName} email={auth?.email} />
        </PageHeader>

        <Panel>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Eyebrow>
                {selectedSubject?.name || t('subject')}
              </Eyebrow>
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                {t('topicWiseQuestions')}
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {t('topicListSubtitle')}
              </p>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-700">{t('questionLimit')}</span>
              <select
                className={theme.control.select}
                onChange={(event) => setLimit(Number(event.target.value))}
                value={limit}
              >
                {limits.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </Panel>

        {error && <AlertMessage>{error}</AlertMessage>}

        {loading ? (
          <LoadingPanel label={t('loading')} />
        ) : topics.length ? (
          <section className="grid gap-3">
            {topics.map((topic) => {
              const topicName = getAcademicName(topic, academicLanguage);
              const subTopics = [...topic.subTopics].sort((a, b) => a.orderIndex - b.orderIndex);
              const topicPerformance = subTopics
                .map((subTopic) => performanceBySubTopic.get(subTopic.id))
                .filter((item): item is SubTopicPerformance => Boolean(item));
              const topicAttempts = topicPerformance.reduce((sum, item) => sum + item.totalAttempts, 0);
              const topicCorrect = topicPerformance.reduce((sum, item) => sum + item.correctCount, 0);
              const topicPercentage = topicAttempts > 0 ? Math.round((topicCorrect / topicAttempts) * 100) : 0;
              const practiceKey = `${topic.id}-Practice`;
              const examKey = `${topic.id}-FixedExam`;

              return (
                <Panel
                  className="transition hover:bg-slate-100"
                  key={topic.id}
                >
                  <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={theme.badge.dark}>
                          {topic.orderIndex}
                        </span>
                        <h2 className="min-w-0 break-words text-xl font-black leading-tight text-slate-950 [overflow-wrap:anywhere]">
                          {topicName}
                        </h2>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {subTopics.length ? (
                          subTopics.slice(0, 5).map((subTopic) => (
                            <span
                              className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-xs font-bold leading-5 text-slate-600 [overflow-wrap:anywhere]"
                              key={subTopic.id}
                            >
                              {getAcademicName(subTopic, academicLanguage)}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-bold text-slate-500">{t('noSubtopics')}</span>
                        )}
                        {subTopics.length > 5 && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                            +{subTopics.length - 5}
                          </span>
                        )}
                      </div>

                      <div className={`mt-4 min-w-0 ${theme.panel.inset}`}>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{t('topicStrength')}</p>
                        {topicAttempts > 0 ? (
                          <div className="mt-2 grid gap-2">
                            <div className="flex flex-wrap items-end justify-between gap-2">
                              <p className="text-2xl font-black text-slate-950">{topicPercentage}%</p>
                              <p className="text-xs font-bold text-slate-500">
                                {t('correctAnswer')}: {topicCorrect}/{topicAttempts} {t('questions')}
                              </p>
                            </div>
                            <div className={theme.progress.track}>
                              <div
                                className={theme.progress.fill}
                                style={{ width: `${Math.min(Math.max(topicPercentage, 0), 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-600 [overflow-wrap:anywhere]">
                            {t('notEnoughData')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:w-80">
                      <Button
                        disabled={startingTopicKey !== ''}
                        onClick={() => void startTopic(topic, 'Practice')}
                        type="button"
                      >
                        {startingTopicKey === practiceKey ? t('loading') : t('startTopicPractice')}
                      </Button>
                      <Button
                        disabled={startingTopicKey !== ''}
                        onClick={() => void startTopic(topic, 'FixedExam')}
                        type="button"
                        variant="secondary"
                      >
                        {startingTopicKey === examKey ? t('loading') : t('startTopicExam')}
                      </Button>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </section>
        ) : (
          <EmptyState title={t('noTopicsTitle')} text={t('noTopicsText')} />
        )}
        <LoadingOverlay label={t('startingExam')} open={startingTopicKey !== ''} />
    </PageShell>
  );
}
