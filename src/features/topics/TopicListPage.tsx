import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Timer } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingPanel, PageShell } from '../../components/ui/Layout';
import { launchQuestionCount } from '../../config/exam';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile, getTopics } from '../../services/academicService';
import { getStudentProgressSummary, type StudentProgressTopic } from '../../services/analyticsService';
import { getExamSessions } from '../../services/examService';
import type { PaperMedium, StudentProfile, TopicWithSubTopics } from '../../types/academic';
import type { ExamSessionSummary } from '../../types/exam';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';
import { startStoredTopicSession } from '../exam/startStoredTopicSession';
import { filterResumableSessions } from '../resume/resumeSessionUtils';
import { useSubscription } from '../subscription/SubscriptionContext';
import { UnitExamSheet } from './UnitExamSheet';

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function newestSession(sessions: ExamSessionSummary[]) {
  return [...sessions].sort((left, right) => (
    new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime()
  ))[0] || null;
}

function sameId(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

export function TopicListPage() {
  const { t } = useLanguage();
  const { recordUsage, status: subscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const requestedTopicId = searchParams.get('topicId');
  const requestedSubTopicId = searchParams.get('subTopicId');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [topics, setTopics] = useState<TopicWithSubTopics[]>([]);
  const [topicProgress, setTopicProgress] = useState<StudentProgressTopic[]>([]);
  const [resumableSessions, setResumableSessions] = useState<ExamSessionSummary[]>([]);
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<TopicWithSubTopics | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!subjectId) return;

    let active = true;
    setLoading(true);
    setLoadError('');

    Promise.all([
      getStudentProfile(),
      getTopics(subjectId),
      getExamSessions({ subjectId, mode: 'TopicExam' }).then(filterResumableSessions).catch(() => []),
    ])
      .then(([studentProfile, topicList, sessionList]) => {
        if (!active) return;
        const sortedTopics = [...topicList].sort((left, right) => left.orderIndex - right.orderIndex);
        setProfile(studentProfile);
        setTopics(sortedTopics);
        setResumableSessions(sessionList);
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error, t('topicsLoadError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [subjectId, t]);

  const canViewTopicProgress = subscription?.progressAccessLevel === 'Detailed'
    || subscription?.progressAccessLevel === 'Full';

  useEffect(() => {
    if (!subjectId || !canViewTopicProgress) {
      setTopicProgress([]);
      return;
    }

    let active = true;
    getStudentProgressSummary(subjectId)
      .then((summary) => {
        if (active) setTopicProgress(summary.topics);
      })
      .catch(() => {
        if (active) setTopicProgress([]);
      });

    return () => {
      active = false;
    };
  }, [canViewTopicProgress, subjectId]);

  useEffect(() => {
    if (loading || !requestedTopicId || !topics.some((topic) => sameId(topic.id, requestedTopicId))) return;

    setExpandedTopicIds((current) => {
      if ([...current].some((topicId) => sameId(topicId, requestedTopicId))) return current;
      return new Set(current).add(requestedTopicId);
    });

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`unit-${requestedTopicId}`);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, requestedTopicId, topics]);

  const academicLanguage = useMemo(
    () => mediumToLanguage((profile?.medium || 'English') as PaperMedium),
    [profile?.medium],
  );
  const selectedSubject = profile?.subjects.find((subject) => subject.id === subjectId);
  const selectedSubjectName = selectedSubject ? getAcademicName(selectedSubject, academicLanguage) : t('subject');
  const progressByTopic = useMemo(
    () => new Map(topicProgress.map((item) => [item.topicId, item])),
    [topicProgress],
  );
  const selectedResumableSession = useMemo(() => {
    if (!selectedTopic) return null;
    return newestSession(resumableSessions.filter((session) => sameId(session.topicId, selectedTopic.id)));
  }, [resumableSessions, selectedTopic]);
  const unitLimitReached = subscription?.monthlyUnitExamLimit !== null
    && subscription?.monthlyUnitExamLimit !== undefined
    && subscription.unitExamsUsed >= subscription.monthlyUnitExamLimit;
  const unitRemaining = subscription?.monthlyUnitExamLimit === null
    ? null
    : Math.max(0, (subscription?.monthlyUnitExamLimit ?? 0) - (subscription?.unitExamsUsed ?? 0));

  if (!subjectId) return <Navigate replace to="/" />;

  const activeSubjectId = subjectId;
  const backPath = `/topics?subjectId=${encodeURIComponent(activeSubjectId)}`;

  function toggleTopic(topicId: string) {
    setExpandedTopicIds((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  function openUnitExam(topic: TopicWithSubTopics) {
    setSelectedTopic(topic);
    setActionError('');
    setSheetOpen(true);
  }

  function continueSession(session: ExamSessionSummary) {
    navigate(`/exam?sessionId=${encodeURIComponent(session.sessionId)}&backPath=${encodeURIComponent(backPath)}`);
  }

  async function startUnitExam() {
    if (!selectedTopic || starting || unitLimitReached) return;

    setStarting(true);
    setActionError('');
    try {
      const started = await startStoredTopicSession({
        backPath,
        limit: launchQuestionCount,
        mode: 'TopicExam',
        title: getAcademicName(selectedTopic, academicLanguage),
        topicId: selectedTopic.id,
      });
      recordUsage('unit');
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(backPath)}`);
    } catch (error) {
      setActionError(getErrorMessage(error, t('topicNotEnoughQuestions')));
    } finally {
      setStarting(false);
    }
  }

  return (
    <PageShell maxWidth="xl">
      <header className="py-1">
        <h1 className="break-words text-2xl font-black leading-tight text-[var(--sf-text)] sm:text-3xl">
          {selectedSubjectName} {t('unitsAndTopics')}
        </h1>
      </header>

      {loadError && <AlertMessage>{loadError}</AlertMessage>}

      {loading ? (
        <LoadingPanel label={t('loading')} />
      ) : topics.length ? (
        <section aria-label={t('unitsAndTopics')} className="grid gap-3">
          {topics.map((topic) => {
            const topicName = getAcademicName(topic, academicLanguage);
            const progress = clampPercent(progressByTopic.get(topic.id)?.masteryPercentage ?? 0);
            const expanded = expandedTopicIds.has(topic.id);
            const hasResume = resumableSessions.some((session) => sameId(session.topicId, topic.id));
            const contentId = `unit-${topic.id}-subtopics`;
            const requested = sameId(topic.id, requestedTopicId);

            return (
              <article
                className={`overflow-hidden rounded-xl border bg-[var(--sf-surface)] shadow-[var(--sf-shadow-sm)] transition hover:shadow-[var(--sf-shadow-md)] ${requested ? 'border-[var(--sf-selected-border)] ring-4 ring-[var(--sf-selected-focus)]' : 'border-[var(--sf-border)] hover:border-[var(--sf-border-strong)]'}`}
                id={`unit-${topic.id}`}
                key={topic.id}
              >
                <div className="grid grid-cols-[48px_minmax(0,1fr)_44px] gap-3 p-4 sm:grid-cols-[52px_minmax(0,1fr)_auto_44px] sm:items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--sf-selected-soft)] text-[var(--sf-brand)] sm:h-13 sm:w-13">
                    <BookOpen aria-hidden="true" className="h-6 w-6" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-[var(--sf-brand)]">{t('unit')} {topic.orderIndex}</p>
                    <h2 className="mt-1 break-words text-base font-black leading-6 text-[var(--sf-text)] sm:text-lg">
                      {topicName}
                    </h2>
                    {canViewTopicProgress ? (
                      <div className="mt-3 flex min-w-0 items-center gap-3">
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--sf-progress-track)]">
                          <div
                            className="h-full rounded-full bg-[var(--sf-primary)] transition-[width] duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs font-black tabular-nums text-[var(--sf-text-soft)]">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    ) : (
                      <Link className="mt-2 inline-flex min-h-8 items-center text-xs font-black text-[var(--sf-brand)]" to="/subscription">
                        {t('topicMasteryBasic')}
                      </Link>
                    )}
                  </div>

                  <Button
                    className="col-span-3 row-start-2 gap-2 sm:col-span-1 sm:row-auto"
                    onClick={() => openUnitExam(topic)}
                    size="lg"
                    type="button"
                  >
                    <Timer aria-hidden="true" className="h-4 w-4" />
                    {hasResume ? t('continue') : t('quickExam')}
                  </Button>

                  <button
                    aria-controls={contentId}
                    aria-expanded={expanded}
                    aria-label={expanded ? t('collapseUnit') : t('expandUnit')}
                    className="grid h-11 w-11 place-items-center rounded-lg text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
                    onClick={() => toggleTopic(topic.id)}
                    type="button"
                  >
                    <ChevronDown aria-hidden="true" className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-[var(--sf-border)] bg-[var(--sf-surface-muted)] px-4" id={contentId}>
                    {topic.subTopics.length ? topic.subTopics
                      .slice()
                      .sort((left, right) => left.orderIndex - right.orderIndex)
                      .map((subTopic, index, sortedSubTopics) => (
                        <div
                          className={`flex min-h-12 items-center gap-3 px-2 py-3 ${sameId(subTopic.id, requestedSubTopicId) ? 'bg-[var(--sf-selected-soft)]' : ''} ${index < sortedSubTopics.length - 1 ? 'border-b border-[var(--sf-border)]' : ''}`}
                          key={subTopic.id}
                        >
                          <span className="w-10 shrink-0 text-xs font-black text-[var(--sf-brand)]">
                            {topic.orderIndex}.{subTopic.orderIndex}
                          </span>
                          <p className="min-w-0 break-words text-sm font-bold leading-5 text-[var(--sf-text-soft)]">
                            {getAcademicName(subTopic, academicLanguage)}
                          </p>
                        </div>
                      )) : (
                      <p className="py-4 text-sm font-semibold text-[var(--sf-text-muted)]">{t('noSubtopics')}</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState imageSrc="/assets/nothing.svg" title={t('noTopicsTitle')} text={t('noTopicsText')} />
      )}

      {selectedTopic && (
        <UnitExamSheet
          error={actionError}
          limitReached={unitLimitReached}
          onClose={() => {
            if (!starting) setSheetOpen(false);
          }}
          onContinue={continueSession}
          onStart={() => void startUnitExam()}
          open={sheetOpen}
          remaining={unitRemaining}
          resumableSession={selectedResumableSession}
          starting={starting}
          unitIndex={selectedTopic.orderIndex}
          unitName={getAcademicName(selectedTopic, academicLanguage)}
        />
      )}
    </PageShell>
  );
}
