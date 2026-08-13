import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { InfoDialog } from '../../components/ui/InfoDialog';
import { EmptyState, Eyebrow, LoadingPanel, PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile, getTopics } from '../../services/academicService';
import { getTopicPerformance, type TopicPerformance } from '../../services/analyticsService';
import { examProgressStorageKey, examSessionStorageKey, startTopicSession } from '../../services/examService';
import type { PaperMedium, StudentProfile, TopicWithSubTopics } from '../../types/academic';
import { theme } from '../../theme/theme';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';
import { useAuth } from '../auth/AuthContext';
import { launchQuestionCount } from '../../config/exam';

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function isLowQuestionMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("doesn't have enough questions")
    || normalized.includes('not enough questions')
    || normalized.includes('no questions available');
}

export function TopicListPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [topics, setTopics] = useState<TopicWithSubTopics[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [startingTopicKey, setStartingTopicKey] = useState('');

  useEffect(() => {
    if (!subjectId) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([getStudentProfile(), getTopics(subjectId), getTopicPerformance(subjectId)])
      .then(([studentProfile, topicList, performanceList]) => {
        if (!active) return;
        setProfile(studentProfile);
        setTopics([...topicList].sort((a, b) => a.orderIndex - b.orderIndex));
        setTopicPerformance(performanceList);
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
  const selectedSubjectName = selectedSubject ? getAcademicName(selectedSubject, academicLanguage) : '';
  const backPath = subjectId ? `/subject?subjectId=${encodeURIComponent(subjectId)}` : '/';
  const performanceByTopic = useMemo(
    () => new Map(topicPerformance.map((item) => [item.topicId, item])),
    [topicPerformance],
  );

  if (!subjectId) {
    return <Navigate to="/" replace />;
  }

  const activeSubjectId = subjectId;

  async function startTopic(topic: TopicWithSubTopics) {
    setError('');
    setStartingTopicKey(`${topic.id}-TopicExam`);

    try {
      const topicBackPath = `/topics?subjectId=${encodeURIComponent(activeSubjectId)}`;
      const started = await startTopicSession(topic.id, launchQuestionCount, 'TopicExam');
      localStorage.removeItem(examProgressStorageKey(started.sessionId));
      localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
        session: started,
        clientStartedAt: Date.now(),
        paperTitle: getAcademicName(topic, academicLanguage),
        backPath: topicBackPath,
      }));
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(topicBackPath)}`);
    } catch (startError) {
      const message = getErrorMessage(startError, t('topicNotEnoughQuestions'));
      if (isLowQuestionMessage(message)) {
        setNoticeMessage(message);
      } else {
        setError(message);
      }
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
          <div className="grid gap-4">
            <div>
              <Eyebrow>
                {selectedSubjectName || t('subject')}
              </Eyebrow>
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                {t('topicWiseQuestions')}
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {t('topicListSubtitle')}
              </p>
            </div>
          </div>
        </Panel>

        {error && <AlertMessage>{error}</AlertMessage>}

        {loading ? (
          <LoadingPanel label={t('loading')} />
        ) : topics.length ? (
          <section className="grid gap-3">
            {topics.map((topic) => {
              const topicName = getAcademicName(topic, academicLanguage);
              const performance = performanceByTopic.get(topic.id);
              const progressItems = [
                { label: t('coverage'), value: performance?.coveragePercentage || 0 },
                { label: t('mastery'), value: performance?.masteryPercentage || 0 },
                { label: t('accuracy'), value: performance?.accuracyPercentage || 0 },
                { label: t('health'), value: performance?.healthPercentage || 0 },
              ];
              const examKey = `${topic.id}-TopicExam`;

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

                      <div className={`mt-4 min-w-0 ${theme.panel.inset}`}>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{t('topicStrength')}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {progressItems.map((item) => (
                            <div className="rounded-lg bg-white p-3 shadow-sm shadow-slate-200/60" key={item.label}>
                              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                              <p className="mt-1 text-xl font-black text-slate-950">{formatPercent(item.value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 lg:w-56">
                      <Button
                        disabled={startingTopicKey !== ''}
                        onClick={() => void startTopic(topic)}
                        type="button"
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
