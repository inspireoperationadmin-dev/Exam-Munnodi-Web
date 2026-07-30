import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, Eyebrow, LoadingPanel, PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import {
  getExamHistory,
  getSubjectPerformance,
  getSubTopicPerformance,
  type ExamHistoryItem,
  type SubjectPerformance,
  type SubTopicPerformance,
} from '../../services/analyticsService';
import type { StudentProfile } from '../../types/academic';
import { getErrorMessage } from '../../utils/errors';
import { useAuth } from '../auth/AuthContext';
import { theme } from '../../theme/theme';

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className={theme.progress.track}>
      <div
        className={theme.progress.fill}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export function ProgressPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance | null>(null);
  const [subTopicPerformance, setSubTopicPerformance] = useState<SubTopicPerformance[]>([]);
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!subjectId) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getStudentProfile(),
      getSubjectPerformance(),
      getSubTopicPerformance(subjectId),
      getExamHistory(subjectId),
    ])
      .then(([studentProfile, subjectRows, subTopicRows, historyRows]) => {
        if (!active) return;
        setProfile(studentProfile);
        setSubjectPerformance(subjectRows.find((item) => item.subjectId === subjectId) || null);
        setSubTopicPerformance(subTopicRows);
        setHistory([...historyRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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

  const selectedSubject = profile?.subjects.find((subject) => subject.id === subjectId);
  const improvementSubTopics = useMemo(
    () => [...subTopicPerformance].sort((a, b) => a.correctPercentage - b.correctPercentage).slice(0, 5),
    [subTopicPerformance],
  );
  const strongestSubTopics = useMemo(
    () => [...subTopicPerformance].sort((a, b) => b.correctPercentage - a.correctPercentage).slice(0, 5),
    [subTopicPerformance],
  );

  if (!subjectId) {
    return <Navigate to="/" replace />;
  }

  const subjectName = selectedSubject?.name || subjectPerformance?.subjectName || t('subject');
  const backPath = `/subject?subjectId=${encodeURIComponent(subjectId)}`;
  const hasProgress = Boolean(subjectPerformance || subTopicPerformance.length || history.length);

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

        {error && <AlertMessage>{error}</AlertMessage>}

        {loading ? (
          <LoadingPanel label={t('loading')} />
        ) : (
          <>
            <Panel>
              <Eyebrow>{subjectName}</Eyebrow>
              <div className="mt-1 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <h1 className="break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                    {t('progress')}
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {t('progressPageSubtitle')}
                  </p>
                </div>
                {subjectPerformance && (
                  <div className="rounded-lg bg-emerald-700 p-4 text-white">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-300">{t('mockAverage')}</p>
                    <p className="mt-1 text-4xl font-black">{formatPercent(subjectPerformance.averageScore)}</p>
                  </div>
                )}
              </div>
            </Panel>

            {!hasProgress ? (
              <EmptyState title={t('noProgressTitle')} text={t('notEnoughData')} />
            ) : (
              <>
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Panel className="p-4 sm:p-4">
                    <p className={theme.text.eyebrow}>{t('mockExams')}</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{subjectPerformance?.totalExams ?? history.length}</p>
                  </Panel>
                  <Panel className="p-4 sm:p-4">
                    <p className={theme.text.eyebrow}>{t('bestScore')}</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{formatPercent(subjectPerformance?.bestScore ?? 0)}</p>
                  </Panel>
                  <Panel className="p-4 sm:p-4">
                    <p className={theme.text.eyebrow}>{t('correctAnswer')}</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {formatPercent(subjectPerformance?.overallCorrectPercentage ?? 0)}
                    </p>
                  </Panel>
                  <Panel className="p-4 sm:p-4">
                    <p className={theme.text.eyebrow}>{t('questions')}</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {subjectPerformance?.totalQuestionsAttempted ?? subTopicPerformance.reduce((sum, item) => sum + item.totalAttempts, 0)}
                    </p>
                  </Panel>
                </section>

                <section className="grid gap-3 lg:grid-cols-2">
                  <Panel>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-base font-black text-slate-950">{t('improvementNeeded')}</h2>
                      <ButtonLink
                        className="text-xs"
                        to={`/topics?subjectId=${encodeURIComponent(subjectId)}`}
                        variant="primary"
                      >
                        {t('practiceImprovementTopics')}
                      </ButtonLink>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {improvementSubTopics.length ? improvementSubTopics.map((item) => (
                        <div className="rounded-md bg-slate-50 p-3" key={item.subTopicId}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-black text-slate-900 [overflow-wrap:anywhere]">{item.subTopicName}</p>
                              <p className="mt-1 break-words text-xs font-bold text-slate-500 [overflow-wrap:anywhere]">{item.topicName}</p>
                            </div>
                            <span className="shrink-0 text-sm font-black text-slate-950">{formatPercent(item.correctPercentage)}</span>
                          </div>
                          <div className="mt-3"><ProgressBar value={item.correctPercentage} /></div>
                        </div>
                      )) : (
                        <p className="text-sm font-bold text-slate-500">{t('notEnoughData')}</p>
                      )}
                    </div>
                  </Panel>

                  <Panel>
                    <h2 className="text-base font-black text-slate-950">{t('strongAreas')}</h2>
                    <div className="mt-4 grid gap-3">
                      {strongestSubTopics.length ? strongestSubTopics.map((item) => (
                        <div className="rounded-md bg-slate-50 p-3" key={item.subTopicId}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-black text-slate-900 [overflow-wrap:anywhere]">{item.subTopicName}</p>
                              <p className="mt-1 break-words text-xs font-bold text-slate-500 [overflow-wrap:anywhere]">{item.topicName}</p>
                            </div>
                            <span className="shrink-0 text-sm font-black text-slate-950">{formatPercent(item.correctPercentage)}</span>
                          </div>
                          <div className="mt-3"><ProgressBar value={item.correctPercentage} /></div>
                        </div>
                      )) : (
                        <p className="text-sm font-bold text-slate-500">{t('notEnoughData')}</p>
                      )}
                    </div>
                  </Panel>
                </section>

                <Panel>
                  <h2 className="text-base font-black text-slate-950">{t('mockHistory')}</h2>
                  <div className="mt-4 grid gap-2">
                    {history.length ? history.map((item, index) => (
                      <Link
                        className={`grid gap-3 ${theme.panel.muted} transition hover:bg-slate-100 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center`}
                        key={item.sessionId}
                        to={`/exam-result?sessionId=${encodeURIComponent(item.sessionId)}`}
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-700 text-sm font-black text-white">
                          {history.length - index}
                        </span>
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-black text-slate-900 [overflow-wrap:anywhere]">
                            {item.paperTitle || t('mockExam')}
                          </span>
                          <span className="mt-1 block text-xs font-bold text-slate-500">{formatDate(item.date)}</span>
                        </span>
                        <span className="text-lg font-black text-slate-950">{formatPercent(item.score)}</span>
                      </Link>
                    )) : (
                      <p className="text-sm font-bold text-slate-500">{t('notEnoughData')}</p>
                    )}
                  </div>
                </Panel>
              </>
            )}
          </>
        )}
    </PageShell>
  );
}
