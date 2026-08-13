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
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';

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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(new Date(value));
}

function buildDailyMockTrend(history: ExamHistoryItem[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 29);
  cutoff.setHours(0, 0, 0, 0);

  const grouped = history
    .filter((item) => new Date(item.date) >= cutoff)
    .reduce((map, item) => {
      const key = new Date(item.date).toISOString().slice(0, 10);
      const scores = map.get(key) || [];
      scores.push(item.score);
      map.set(key, scores);
      return map;
    }, new Map<string, number[]>());

  return [...grouped.entries()]
    .map(([date, scores]) => ({
      date,
      score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function MockTrendGraph({ emptyLabel, points }: { emptyLabel: string; points: { date: string; score: number }[] }) {
  if (!points.length) {
    return (
      <div className="grid min-h-48 place-items-center rounded-xl bg-slate-50 px-4 text-center text-sm font-bold leading-6 text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padding = 30;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const plotPoints = points.map((point, index) => {
    const x = points.length === 1
      ? width / 2
      : padding + (index / (points.length - 1)) * usableWidth;
    const y = padding + (1 - clampPercent(point.score) / 100) * usableHeight;
    return { ...point, x, y };
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <svg className="h-auto w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
        <title>30-day mock exam trend</title>
        {[0, 25, 50, 75, 100].map((value) => {
          const y = padding + (1 - value / 100) * usableHeight;
          return (
            <g key={value}>
              <line stroke="#e2e8f0" strokeWidth="1" x1={padding} x2={width - padding} y1={y} y2={y} />
              <text fill="#64748b" fontSize="11" fontWeight="700" x="6" y={y + 4}>{value}</text>
            </g>
          );
        })}
        {plotPoints.length === 1 ? (
          <circle cx={plotPoints[0].x} cy={plotPoints[0].y} fill="#059669" r="5" />
        ) : (
          plotPoints.slice(1).map((point, index) => {
            const previous = plotPoints[index];
            const improved = point.score >= previous.score;
            return (
              <line
                key={`${previous.date}-${point.date}`}
                stroke={improved ? '#059669' : '#dc2626'}
                strokeLinecap="round"
                strokeWidth="4"
                x1={previous.x}
                x2={point.x}
                y1={previous.y}
                y2={point.y}
              />
            );
          })
        )}
        {plotPoints.map((point) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} fill="#ffffff" r="5" stroke="#0f172a" strokeWidth="2" />
            <text fill="#0f172a" fontSize="11" fontWeight="800" textAnchor="middle" x={point.x} y={point.y - 10}>
              {Math.round(point.score)}%
            </text>
          </g>
        ))}
        <text fill="#475569" fontSize="11" fontWeight="800" textAnchor="start" x={padding} y={height - 8}>
          {formatShortDate(plotPoints[0].date)}
        </text>
        <text fill="#475569" fontSize="11" fontWeight="800" textAnchor="end" x={width - padding} y={height - 8}>
          {formatShortDate(plotPoints[plotPoints.length - 1].date)}
        </text>
      </svg>
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
  const academicLanguage = mediumToLanguage(profile?.medium || 'English');
  const focusSubTopics = useMemo(
    () => [...subTopicPerformance]
      .filter((item) => item.uniqueQuestionsAttempted > 0)
      .sort((a, b) => a.masteryPercentage - b.masteryPercentage || a.healthPercentage - b.healthPercentage)
      .slice(0, 4),
    [subTopicPerformance],
  );
  const mockTrend = useMemo(() => buildDailyMockTrend(history), [history]);

  if (!subjectId) {
    return <Navigate to="/" replace />;
  }

  const subjectName = selectedSubject ? getAcademicName(selectedSubject, academicLanguage) : subjectPerformance?.subjectName || t('subject');
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
              <div className="mt-1 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <h1 className="break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                    {t('progress')}
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {t('progressPageSubtitle')}
                  </p>
                </div>
                {subjectPerformance && (
                  <div className="rounded-xl bg-emerald-700 p-4 text-white">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-100">{t('subjectMastery')}</p>
                    <p className="mt-1 text-4xl font-black">{formatPercent(subjectPerformance.masteryPercentage)}</p>
                  </div>
                )}
              </div>
            </Panel>

            {!hasProgress ? (
              <EmptyState title={t('noProgressTitle')} text={t('notEnoughData')} />
            ) : (
              <>
                <Panel>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                    <div>
                      <h2 className="text-base font-black text-slate-950">{t('subjectMastery')}</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{t('subjectMasteryText')}</p>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${clampPercent(subjectPerformance?.masteryPercentage ?? 0)}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className={theme.text.eyebrow}>{t('mockExams')}</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{subjectPerformance?.totalExams ?? history.length}</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{t('mockExamTrendText')}</p>
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black text-slate-950">{t('mockTrend')}</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{t('mockTrendSubtitle')}</p>
                    </div>
                    <div className="flex gap-3 text-xs font-black text-slate-500">
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded-full bg-emerald-600" />{t('improved')}</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded-full bg-red-600" />{t('needsPractice')}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <MockTrendGraph emptyLabel={t('mockTrendEmpty')} points={mockTrend} />
                  </div>
                </Panel>

                <Panel>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black text-slate-950">{t('focusNext')}</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{t('focusNextText')}</p>
                    </div>
                    <ButtonLink
                      className="text-xs"
                      to={`/topics?subjectId=${encodeURIComponent(subjectId)}`}
                      variant="primary"
                    >
                      {t('practiceImprovementTopics')}
                    </ButtonLink>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {focusSubTopics.length ? focusSubTopics.map((item) => (
                      <div className="rounded-xl bg-slate-50 p-4" key={item.subTopicId}>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <div className="min-w-0">
                            <p className="break-words text-xs font-black uppercase tracking-wide text-emerald-700 [overflow-wrap:anywhere]">{item.topicName}</p>
                            <p className="mt-1 break-words text-base font-black text-slate-950 [overflow-wrap:anywhere]">{item.subTopicName}</p>
                            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{t('focusSubtopicText')}</p>
                          </div>
                          <div className="rounded-lg bg-white px-4 py-3 text-left shadow-sm shadow-slate-200/70 sm:text-right">
                            <p className={theme.text.eyebrow}>{t('mastery')}</p>
                            <p className="mt-1 text-2xl font-black text-slate-950">{formatPercent(item.masteryPercentage)}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">{t('focusEmptyText')}</p>
                    )}
                  </div>
                </Panel>

                <Panel>
                  <h2 className="text-base font-black text-slate-950">{t('recentMockExams')}</h2>
                  <div className="mt-4 grid gap-2">
                    {history.length ? history.slice(0, 5).map((item, index) => (
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
