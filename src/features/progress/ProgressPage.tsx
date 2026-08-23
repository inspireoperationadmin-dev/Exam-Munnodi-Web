import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CircleHelp, Target } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button, ButtonLink } from '../../components/ui/Button';
import { InfoDialog } from '../../components/ui/InfoDialog';
import { LoadingPanel, PageShell } from '../../components/ui/Layout';
import { launchExamTimeLimitMinutes, launchQuestionCount } from '../../config/exam';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import {
  getStudentProgressSummary,
  type StudentProgressSummary,
  type StudentProgressTopic,
} from '../../services/analyticsService';
import type { StudentProfile } from '../../types/academic';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';
import { QuickExamSheet } from '../exam/QuickExamSheet';
import { startStoredMockExam } from '../exam/startStoredMockExam';
import { useSubscription } from '../subscription/SubscriptionContext';

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatMode(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function MasteryMeter({ value }: { value: number }) {
  const clamped = clampPercent(value);

  return (
    <div
      aria-label={`Mastery ${Math.round(clamped)} percent`}
      className="grid aspect-square w-28 shrink-0 place-items-center rounded-full"
      role="img"
      style={{
        background: `conic-gradient(var(--sf-primary) ${clamped * 3.6}deg, var(--sf-progress-track) 0deg)`,
      }}
    >
      <div className="grid h-[78%] w-[78%] place-items-center rounded-full bg-[var(--sf-surface)] text-center shadow-[var(--sf-shadow-sm)]">
        <span className="text-2xl font-black tabular-nums text-[var(--sf-text)]">{formatPercent(clamped)}</span>
      </div>
    </div>
  );
}

function topicPath(subjectId: string, topicId: string, subTopicId?: string) {
  const query = new URLSearchParams({ subjectId, topicId });
  if (subTopicId) query.set('subTopicId', subTopicId);
  return `/topics?${query.toString()}`;
}

function TopicMasteryCard({ subjectId, topic }: { subjectId: string; topic: StudentProgressTopic }) {
  const { t } = useLanguage();
  const progress = clampPercent(topic.masteryPercentage);

  return (
    <Link
      className="group block rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] transition hover:border-[var(--sf-border-strong)] hover:shadow-[var(--sf-shadow-md)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
      to={topicPath(subjectId, topic.topicId)}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-black leading-5 text-[var(--sf-text)]">{topic.topicName}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--sf-progress-track)]">
              <div
                className="h-full rounded-full bg-[var(--sf-primary)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-black tabular-nums text-[var(--sf-text-soft)]">
              {formatPercent(progress)}
            </span>
          </div>
          {topic.needsImprovementSubTopicCount > 0 && (
            <p className="mt-2 text-xs font-bold text-[var(--sf-warning-text)]">
              {topic.needsImprovementSubTopicCount} {t(topic.needsImprovementSubTopicCount === 1 ? 'areaToImprove' : 'areasToImprove')}
            </p>
          )}
        </div>
        <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--sf-text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--sf-brand)]" />
      </div>
    </Link>
  );
}

export function ProgressPage() {
  const { t } = useLanguage();
  const { recordUsage, status: subscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [summary, setSummary] = useState<StudentProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [masteryInfoOpen, setMasteryInfoOpen] = useState(false);
  const [quickExamOpen, setQuickExamOpen] = useState(false);
  const [quickExamError, setQuickExamError] = useState('');
  const [startingQuickExam, setStartingQuickExam] = useState(false);

  useEffect(() => {
    if (!subjectId) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getStudentProfile(),
      getStudentProgressSummary(subjectId),
    ])
      .then(([studentProfile, progressSummary]) => {
        if (!active) return;
        setProfile(studentProfile);
        setSummary(progressSummary);
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('progressLoadError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [subjectId, t]);

  const academicLanguage = mediumToLanguage(profile?.medium || 'English');
  const selectedProfileSubject = profile?.subjects.find((subject) => subject.id === subjectId);
  const selectedSubject = summary?.subjects.find((subject) => subject.subjectId === subjectId) || null;
  const topics = useMemo(
    () => [...(summary?.topics || [])].sort((left, right) => (
      left.masteryPercentage - right.masteryPercentage || left.topicName.localeCompare(right.topicName)
    )),
    [summary?.topics],
  );
  const focusSubTopics = summary?.needsImprovement.slice(0, 3) || [];
  const recentScores = summary?.recentExamScores.slice(0, 5) || [];
  const hasDetailedProgress = subscription?.progressAccessLevel === 'Detailed'
    || subscription?.progressAccessLevel === 'Full';
  const hasFullProgress = subscription?.progressAccessLevel === 'Full';
  const mockLimitReached = subscription?.monthlyMockExamLimit !== null
    && subscription?.monthlyMockExamLimit !== undefined
    && subscription.mockExamsUsed >= subscription.monthlyMockExamLimit;

  if (!subjectId) return <Navigate replace to="/" />;

  const activeSubjectId = subjectId;
  const subjectName = selectedSubject?.subjectName
    || (selectedProfileSubject ? getAcademicName(selectedProfileSubject, academicLanguage) : t('subject'));
  const mastery = selectedSubject?.masteryPercentage ?? 0;
  const hasMasteryActivity = Boolean(selectedSubject?.lastStudiedAt || topics.some((topic) => topic.lastUpdated));
  const unitsPath = `/topics?subjectId=${encodeURIComponent(activeSubjectId)}`;
  const progressPath = `/progress?subjectId=${encodeURIComponent(activeSubjectId)}`;

  async function startQuickExam() {
    if (startingQuickExam || mockLimitReached) return;

    setStartingQuickExam(true);
    setQuickExamError('');
    try {
      const started = await startStoredMockExam({
        backPath: progressPath,
        questionCount: launchQuestionCount,
        subjectId: activeSubjectId,
        title: subjectName,
      });
      recordUsage('mock');
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(progressPath)}`);
    } catch (startError) {
      setQuickExamError(getErrorMessage(startError, t('mockNotEnoughQuestions')));
    } finally {
      setStartingQuickExam(false);
    }
  }

  return (
    <PageShell maxWidth="xl">
      <header className="py-1">
        <h1 className="break-words text-2xl font-black leading-tight text-[var(--sf-text)] sm:text-3xl">
          {subjectName} {t('progress')}
        </h1>
      </header>

      {error && <AlertMessage>{error}</AlertMessage>}

      {loading ? (
        <LoadingPanel label={t('loading')} />
      ) : (
        <>
          <section className="overflow-hidden rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-md)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-[var(--sf-brand)]">{t('subjectMastery')}</p>
                <h2 className="mt-1 text-xl font-black text-[var(--sf-text)]">
                  {hasMasteryActivity ? t('masterySupportText') : t('buildMasteryBaseline')}
                </h2>
              </div>
              <button
                aria-label={t('masteryCalculationTitle')}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-brand)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
                onClick={() => setMasteryInfoOpen(true)}
                type="button"
              >
                <CircleHelp aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_112px] items-center gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
                  {hasMasteryActivity ? t('subjectMasteryText') : t('notEnoughData')}
                </p>
                {selectedSubject?.lastStudiedAt && (
                  <p className="mt-3 text-xs font-black text-[var(--sf-text-soft)]">
                    {t('lastStudied')}: {formatDate(selectedSubject.lastStudiedAt)}
                  </p>
                )}
              </div>
              <MasteryMeter value={mastery} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button className="gap-2" onClick={() => setQuickExamOpen(true)} size="lg" type="button">
                <Target aria-hidden="true" className="h-4 w-4" />
                {t('quickExam')}
              </Button>
              <ButtonLink className="gap-2" size="lg" to={unitsPath} variant="secondary">
                <BookOpen aria-hidden="true" className="h-4 w-4" />
                {t('unitsShort')}
              </ButtonLink>
            </div>
          </section>

          {hasDetailedProgress ? (
            <section aria-labelledby="focus-next-title">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-[var(--sf-text)]" id="focus-next-title">{t('focusNext')}</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{t('focusNextText')}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {focusSubTopics.length ? focusSubTopics.map((item) => (
                  <Link
                    className="group flex min-h-32 flex-col rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] transition hover:border-[var(--sf-border-strong)] hover:shadow-[var(--sf-shadow-md)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
                    key={item.subTopicId}
                    to={topicPath(activeSubjectId, item.topicId, item.subTopicId)}
                  >
                    <p className="text-xs font-black uppercase text-[var(--sf-warning-text)]">{item.topicName}</p>
                    <p className="mt-2 break-words text-base font-black leading-6 text-[var(--sf-text)]">{item.subTopicName}</p>
                    <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm font-black text-[var(--sf-brand)]">
                      {t('openUnit')}
                      <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                )) : (
                  <div className="md:col-span-3 rounded-xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                    <p className="text-sm font-bold leading-6 text-[var(--sf-text-muted)]">{t('focusEmptyText')}</p>
                    <ButtonLink className="mt-3" size="sm" to={unitsPath} variant="secondary">{t('viewUnits')}</ButtonLink>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] sm:p-5">
              <p className="text-xs font-black uppercase text-[var(--sf-brand)]">{t('detailedProgress')}</p>
              <h2 className="mt-1 text-xl font-black text-[var(--sf-text)]">{t('unlockTopicGuidance')}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{t('unlockTopicGuidanceText')}</p>
              <ButtonLink className="mt-4" to="/subscription" variant="primary">{t('viewPlans')}</ButtonLink>
            </section>
          )}

          {hasDetailedProgress && (
            <section aria-labelledby="topic-mastery-title">
              <h2 className="text-lg font-black text-[var(--sf-text)]" id="topic-mastery-title">{t('topicMastery')}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{t('topicMasteryText')}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {topics.length ? topics.map((topic) => (
                  <TopicMasteryCard key={topic.topicId} subjectId={activeSubjectId} topic={topic} />
                )) : (
                  <p className="md:col-span-2 rounded-xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 text-sm font-bold leading-6 text-[var(--sf-text-muted)]">
                    {t('topicMasteryEmpty')}
                  </p>
                )}
              </div>
            </section>
          )}

          {hasFullProgress ? (
            <section aria-labelledby="recent-scores-title">
              <h2 className="text-lg font-black text-[var(--sf-text)]" id="recent-scores-title">{t('recentExamScores')}</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-sm)]">
                {recentScores.length ? recentScores.map((item, index) => (
                  <div
                    className={`flex min-h-16 items-center justify-between gap-3 px-4 py-3 ${index < recentScores.length - 1 ? 'border-b border-[var(--sf-border)]' : ''}`}
                    key={item.sessionId}
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-[var(--sf-text)]">{formatMode(item.mode)}</p>
                      <p className="mt-1 text-xs font-bold text-[var(--sf-text-muted)]">{formatDate(item.completedAt)}</p>
                    </div>
                    <span className="shrink-0 text-lg font-black tabular-nums text-[var(--sf-text)]">{formatPercent(item.score)}</span>
                  </div>
                )) : (
                  <p className="p-4 text-sm font-bold text-[var(--sf-text-muted)]">{t('notEnoughData')}</p>
                )}
              </div>
            </section>
          ) : hasDetailedProgress ? (
            <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] sm:p-5">
              <p className="text-xs font-black uppercase text-[var(--sf-brand)]">{t('proProgress')}</p>
              <h2 className="mt-1 text-xl font-black text-[var(--sf-text)]">{t('unlockExamHistory')}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{t('unlockExamHistoryText')}</p>
              <ButtonLink className="mt-4" to="/subscription" variant="secondary">{t('viewProPlan')}</ButtonLink>
            </section>
          ) : null}
        </>
      )}

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
        subjectName={subjectName}
        timeMinutes={launchExamTimeLimitMinutes}
      />
    </PageShell>
  );
}
