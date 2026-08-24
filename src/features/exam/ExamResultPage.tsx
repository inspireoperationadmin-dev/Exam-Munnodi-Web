import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  Info,
  MinusCircle,
  Target,
  X,
  XCircle,
} from 'lucide-react';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button, ButtonLink } from '../../components/ui/Button';
import { EmptyState, LoadingPanel, PageShell, Panel } from '../../components/ui/Layout';
import { MathText } from '../../components/ui/MathText';
import { useLanguage } from '../../i18n/LanguageContext';
import { getSessionDetail, getSessionReview } from '../../services/examService';
import type { ExamMode, SessionDetail, SessionReviewItem } from '../../types/exam';
import { getExamModeLabelKey } from '../../utils/examMode';
import { getErrorMessage } from '../../utils/errors';
import { useSubscription } from '../subscription/SubscriptionContext';

type ReviewFilter = 'all' | 'incorrect' | 'unanswered';

function sameId(first?: string | null, second?: string | null) {
  return Boolean(first && second && first.toLowerCase() === second.toLowerCase());
}

function formatDuration(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function masteryImpactKey(mode: ExamMode) {
  if (mode === 'MockExam') return 'mockMasteryImpact' as const;
  if (mode === 'TopicExam') return 'unitMasteryImpact' as const;
  return 'paperNoMasteryImpact' as const;
}

function ReviewStatusIcon({ item, className = 'h-4 w-4' }: { item: SessionReviewItem; className?: string }) {
  if (item.isCorrect) return <CheckCircle2 aria-hidden="true" className={`${className} text-[var(--sf-success-text)]`} />;
  if (item.selectedOptionId) return <XCircle aria-hidden="true" className={`${className} text-[var(--sf-danger-text)]`} />;
  return <MinusCircle aria-hidden="true" className={`${className} text-[var(--sf-text-muted)]`} />;
}

interface ReviewSheetProps {
  item: SessionReviewItem;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

function ReviewSheet({ item, canGoPrevious, canGoNext, onClose, onPrevious, onNext }: ReviewSheetProps) {
  const { t } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && canGoPrevious) onPrevious();
      if (event.key === 'ArrowRight' && canGoNext) onNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canGoNext, canGoPrevious, onClose, onNext, onPrevious]);

  const answerState = item.isCorrect
    ? t('correctAnswer')
    : item.selectedOptionId
      ? t('wrongAnswer')
      : t('unanswered');

  return (
    <div
      className="sf-sheet-backdrop-enter fixed inset-0 z-50 flex items-end justify-center bg-[var(--sf-scrim)] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        aria-labelledby="review-sheet-title"
        aria-modal="true"
        className="sf-sheet-enter flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-lg)] sm:rounded-xl"
        role="dialog"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--sf-border)] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--sf-surface-muted)]">
              <ReviewStatusIcon className="h-5 w-5" item={item} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-[var(--sf-text-muted)]">{t('answerReview')}</p>
              <h2 className="truncate text-base font-black text-[var(--sf-text)]" id="review-sheet-title">
                {t('questionNumber')} {item.orderIndex} · {answerState}
              </h2>
            </div>
          </div>
          <button
            aria-label={t('close')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-5">
          <MathText
            className="block break-words text-base font-black leading-8 text-[var(--sf-text)] [overflow-wrap:anywhere] sm:text-lg"
            text={item.questionText}
          />
          {item.questionImageUrl && (
            <img
              alt=""
              className="mt-4 max-h-80 w-full rounded-lg border border-[var(--sf-border)] object-contain"
              src={item.questionImageUrl}
            />
          )}

          <div className="mt-5 grid gap-2">
            {item.options.map((option) => {
              const selected = sameId(item.selectedOptionId, option.id);
              const correct = option.isCorrect || sameId(item.correctOptionId, option.id);
              const wrongSelected = selected && !correct;

              return (
                <div
                  className={[
                    'min-w-0 rounded-lg border p-3',
                    correct ? 'border-[var(--sf-success-text)] bg-[var(--sf-success-soft)]' : 'border-[var(--sf-border)] bg-[var(--sf-surface-muted)]',
                    wrongSelected ? 'border-[var(--sf-danger)] bg-[var(--sf-danger-soft)]' : '',
                  ].join(' ')}
                  key={option.id}
                >
                  <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-2">
                    <span className={`font-black ${correct ? 'text-[var(--sf-success-text)]' : wrongSelected ? 'text-[var(--sf-danger-text)]' : 'text-[var(--sf-text-soft)]'}`}>
                      {option.label}
                    </span>
                    <div className="min-w-0">
                      {(correct || selected) && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {correct && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--sf-success)] px-2 py-1 text-xs font-black text-[var(--sf-success-on)]">
                              <Check aria-hidden="true" className="h-3.5 w-3.5" />
                              {t('correctAnswer')}
                            </span>
                          )}
                          {selected && (
                            <span className={`rounded-md px-2 py-1 text-xs font-black ${wrongSelected ? 'bg-[var(--sf-danger)] text-[var(--sf-danger-on)]' : 'bg-[var(--sf-surface)] text-[var(--sf-text-soft)]'}`}>
                              {t('yourAnswer')}
                            </span>
                          )}
                        </div>
                      )}
                      <MathText
                        className="block break-words text-sm font-bold leading-6 text-[var(--sf-text)] [overflow-wrap:anywhere]"
                        text={option.optionText}
                      />
                      {option.optionImageUrl && (
                        <img
                          alt=""
                          className="mt-3 max-h-56 w-full rounded-md border border-[var(--sf-border)] object-contain"
                          src={option.optionImageUrl}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="mt-5 border-t border-[var(--sf-border)] pt-5">
            <h3 className="text-base font-black text-[var(--sf-text)]">{t('explanation')}</h3>
            {item.explanation?.sections.length ? (
              <div className="mt-3 grid gap-4">
                {item.explanation.sections
                  .slice()
                  .sort((first, second) => first.orderIndex - second.orderIndex)
                  .map((section) => (
                    <section key={`${item.questionId}-${section.orderIndex}`}>
                      <h4 className="text-sm font-black text-[var(--sf-text)]">{section.title}</h4>
                      <MathText
                        className="mt-1 block break-words text-sm font-semibold leading-7 text-[var(--sf-text-soft)] [overflow-wrap:anywhere]"
                        text={section.content}
                      />
                    </section>
                  ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-bold text-[var(--sf-text-muted)]">{t('noExplanation')}</p>
            )}
          </section>
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--sf-border)] bg-[var(--sf-surface)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4">
          <Button disabled={!canGoPrevious} onClick={onPrevious} variant="secondary">
            <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
            {t('previous')}
          </Button>
          <Button disabled={!canGoNext} onClick={onNext} variant="primary">
            {t('next')}
            <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
          </Button>
        </footer>
      </article>
    </div>
  );
}

export function ExamResultPage() {
  const { t } = useLanguage();
  const { status: subscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const reviewSectionRef = useRef<HTMLElement | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [reviewItems, setReviewItems] = useState<SessionReviewItem[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    setLoading(true);
    setReviewLoading(true);
    setError('');
    setReviewError('');

    getSessionDetail(sessionId)
      .then((sessionDetail) => {
        if (active) setDetail(sessionDetail);
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, 'Could not load exam result.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getSessionReview(sessionId)
      .then((review) => {
        if (active) setReviewItems([...review].sort((first, second) => first.orderIndex - second.orderIndex));
      })
      .catch((loadError) => {
        if (active) setReviewError(getErrorMessage(loadError, t('reviewUnavailableText')));
      })
      .finally(() => {
        if (active) setReviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId, t]);

  const filteredReviewItems = useMemo(() => {
    if (reviewFilter === 'incorrect') return reviewItems.filter((item) => !item.isCorrect && Boolean(item.selectedOptionId));
    if (reviewFilter === 'unanswered') return reviewItems.filter((item) => !item.selectedOptionId);
    return reviewItems;
  }, [reviewFilter, reviewItems]);

  const selectedQuestionIndex = useMemo(
    () => filteredReviewItems.findIndex((item) => item.questionId === selectedQuestionId),
    [filteredReviewItems, selectedQuestionId],
  );
  const selectedQuestion = selectedQuestionIndex >= 0 ? filteredReviewItems[selectedQuestionIndex] : null;

  if (!sessionId) return <Navigate to="/" replace />;

  const subjectPath = detail?.subjectId ? `/progress?subjectId=${encodeURIComponent(detail.subjectId)}` : '/';
  const topicsPath = detail?.subjectId ? `/topics?subjectId=${encodeURIComponent(detail.subjectId)}` : '/';
  const papersPath = detail?.subjectId ? `/papers?subjectId=${encodeURIComponent(detail.subjectId)}` : '/papers';
  const modeLabel = t(getExamModeLabelKey(detail?.mode));
  const percentage = Math.min(100, Math.max(0, Math.round(detail?.percentage || 0)));
  const hasDetailedProgress = subscription?.progressAccessLevel === 'Detailed' || subscription?.progressAccessLevel === 'Full';
  const affectsMastery = detail?.affectsMastery ?? (detail?.mode === 'MockExam' || detail?.mode === 'TopicExam');
  const primaryProgressLabel = hasDetailedProgress ? t('reviewAreasToImprove') : t('viewSubjectMastery');
  const hasReviewData = detail?.hasReviewData ?? (reviewItems.length > 0);
  const isPassing = detail?.isPassing ?? (percentage >= 40);
  const fallbackTimeTakenSeconds = detail
    ? Math.max(0, (new Date(detail.endTime || detail.serverNow).getTime() - new Date(detail.startTime).getTime()) / 1000)
    : 0;
  const timeTakenSeconds = detail?.timeTakenSeconds ?? fallbackTimeTakenSeconds;

  function openFirstReview(filter: ReviewFilter) {
    const candidates = filter === 'incorrect'
      ? reviewItems.filter((item) => !item.isCorrect && Boolean(item.selectedOptionId))
      : filter === 'unanswered'
        ? reviewItems.filter((item) => !item.selectedOptionId)
        : reviewItems;

    setReviewFilter(filter);
    reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (candidates[0]) setSelectedQuestionId(candidates[0].questionId);
  }

  return (
    <PageShell maxWidth="xl">
      <header className="flex items-center justify-between gap-3">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-black text-[var(--sf-text-soft)] transition hover:bg-[var(--sf-surface-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
          to={detail?.paperId ? papersPath : subjectPath}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          {detail?.paperId ? t('backToPapers') : t('viewProgress')}
        </Link>
        {detail && (
          <span className="rounded-md bg-[var(--sf-surface-muted)] px-2.5 py-1.5 text-xs font-black text-[var(--sf-brand)]">
            {modeLabel}
          </span>
        )}
      </header>

      {error && <AlertMessage>{error}</AlertMessage>}

      {loading ? (
        <LoadingPanel label={t('loading')} />
      ) : detail ? (
        <>
          <section
            className="overflow-hidden rounded-xl border border-[var(--sf-mastery-border)] p-5 text-[var(--sf-mastery-on)] shadow-[var(--sf-shadow-lg)] sm:p-7"
            style={{ background: 'var(--sf-mastery-surface)' }}
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-[var(--sf-mastery-on-muted)]">{t('resultSummary')}</p>
                <h1 className="mt-2 break-words text-2xl font-black leading-tight sm:text-3xl">
                  {detail.paperTitle || modeLabel}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--sf-mastery-glass)] px-2.5 py-1.5 text-sm font-black">
                    {isPassing ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <Target aria-hidden="true" className="h-4 w-4" />}
                    {isPassing ? t('passed') : t('keepPractising')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--sf-mastery-on-muted)]">
                    <Clock3 aria-hidden="true" className="h-4 w-4" />
                    {formatDuration(timeTakenSeconds)}
                  </span>
                </div>

                <dl className="mt-6 grid grid-cols-3 divide-x divide-[var(--sf-mastery-divider)] border-y border-[var(--sf-mastery-divider)] py-3">
                  <div className="px-2 first:pl-0">
                    <dt className="text-xs font-bold text-[var(--sf-mastery-on-muted)]">{t('correctAnswer')}</dt>
                    <dd className="mt-1 text-xl font-black">{hasReviewData ? detail.correctCount : '–'}</dd>
                  </div>
                  <div className="px-3">
                    <dt className="text-xs font-bold text-[var(--sf-mastery-on-muted)]">{t('wrongAnswer')}</dt>
                    <dd className="mt-1 text-xl font-black">{hasReviewData ? detail.wrongCount : '–'}</dd>
                  </div>
                  <div className="px-3 pr-0">
                    <dt className="text-xs font-bold text-[var(--sf-mastery-on-muted)]">{t('unanswered')}</dt>
                    <dd className="mt-1 text-xl font-black">{hasReviewData ? detail.skippedCount : '–'}</dd>
                  </div>
                </dl>
              </div>

              <div className="grid place-items-center lg:justify-self-end">
                <div
                  aria-label={`${percentage}%`}
                  className="grid h-44 w-44 place-items-center rounded-full p-2 shadow-[var(--sf-shadow-md)]"
                  role="img"
                  style={{ background: `conic-gradient(var(--sf-mastery-ring) ${percentage * 3.6}deg, var(--sf-mastery-ring-track) 0deg)` }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-[var(--sf-mastery-ring-center)] text-center">
                    <div>
                      <p className="text-4xl font-black tabular-nums">{percentage}%</p>
                      <p className="mt-1 text-xs font-bold text-[var(--sf-mastery-on-muted)]">
                        {detail.obtainedMarks} / {detail.totalMarks} {t('score')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Panel>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--sf-selected-soft)] text-[var(--sf-brand)]">
                {affectsMastery ? <BarChart3 aria-hidden="true" className="h-5 w-5" /> : <Info aria-hidden="true" className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-black text-[var(--sf-text)]">{t('masteryImpact')}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
                  {t(masteryImpactKey(detail.mode))}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {affectsMastery ? (
                <>
                  <ButtonLink fullWidth to={subjectPath} variant="primary">
                    {primaryProgressLabel}
                    <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink fullWidth to={topicsPath} variant="secondary">
                    {t('practiceImprovementTopics')}
                  </ButtonLink>
                </>
              ) : (
                <>
                  <Button fullWidth onClick={() => openFirstReview('incorrect')} variant="primary">
                    {t('reviewAnswers')}
                    <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                  </Button>
                  <ButtonLink fullWidth to={papersPath} variant="secondary">
                    {t('backToPapers')}
                  </ButtonLink>
                </>
              )}
            </div>
          </Panel>

          <section ref={reviewSectionRef} className="scroll-mt-4">
            <Panel>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-[var(--sf-brand)]">{t('answerReview')}</p>
                  <h2 className="mt-1 text-xl font-black text-[var(--sf-text)]">{t('questions')}</h2>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--sf-surface-muted)] text-[var(--sf-text-muted)]">
                  <FileQuestion aria-hidden="true" className="h-5 w-5" />
                </span>
              </div>

              {reviewLoading ? (
                <div className="mt-5 grid min-h-32 place-items-center text-sm font-bold text-[var(--sf-text-muted)]">{t('loading')}</div>
              ) : reviewError ? (
                <div className="mt-5 rounded-lg border border-[var(--sf-danger-border)] bg-[var(--sf-surface)] p-4">
                  <h3 className="font-black text-[var(--sf-text)]">{t('reviewLoadFailed')}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{reviewError}</p>
                </div>
              ) : !hasReviewData ? (
                <div className="mt-5 rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-4">
                  <h3 className="font-black text-[var(--sf-text)]">{t('reviewUnavailableTitle')}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{t('reviewUnavailableText')}</p>
                </div>
              ) : (
                <>
                  <div aria-label={t('answerReview')} className="mt-5 grid grid-cols-3 rounded-lg bg-[var(--sf-surface-muted)] p-1" role="group">
                    {([
                      ['all', t('allQuestions'), reviewItems.length],
                      ['incorrect', t('incorrectQuestions'), detail.wrongCount],
                      ['unanswered', t('unanswered'), detail.skippedCount],
                    ] as const).map(([filter, label, count]) => (
                      <button
                        aria-pressed={reviewFilter === filter}
                        className={`min-h-10 rounded-md px-2 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)] sm:text-sm ${reviewFilter === filter ? 'bg-[var(--sf-surface)] text-[var(--sf-brand)] shadow-[var(--sf-shadow-sm)]' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text)]'}`}
                        key={filter}
                        onClick={() => setReviewFilter(filter)}
                        type="button"
                      >
                        {label} <span className="tabular-nums">{count}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-[var(--sf-text-muted)]">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[var(--sf-success-text)]" />{t('correctAnswer')}</span>
                    <span className="inline-flex items-center gap-1.5"><XCircle aria-hidden="true" className="h-4 w-4 text-[var(--sf-danger-text)]" />{t('wrongAnswer')}</span>
                    <span className="inline-flex items-center gap-1.5"><MinusCircle aria-hidden="true" className="h-4 w-4" />{t('unanswered')}</span>
                  </div>

                  {filteredReviewItems.length ? (
                    <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                      {filteredReviewItems.map((item) => (
                        <button
                          aria-label={`${t('questionNumber')} ${item.orderIndex}: ${item.isCorrect ? t('correctAnswer') : item.selectedOptionId ? t('wrongAnswer') : t('unanswered')}`}
                          className={[
                            'relative grid aspect-square min-h-11 place-items-center rounded-lg border text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]',
                            item.isCorrect ? 'border-[var(--sf-success-text)] bg-[var(--sf-success-soft)] text-[var(--sf-success-text)]' : item.selectedOptionId ? 'border-[var(--sf-danger-border)] bg-[var(--sf-danger-soft)] text-[var(--sf-danger-text)]' : 'border-[var(--sf-border)] bg-[var(--sf-surface-muted)] text-[var(--sf-text-muted)]',
                          ].join(' ')}
                          key={item.questionId}
                          onClick={() => setSelectedQuestionId(item.questionId)}
                          type="button"
                        >
                          {item.orderIndex}
                          <span className="absolute right-1 top-1"><ReviewStatusIcon className="h-3 w-3" item={item} /></span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 rounded-lg bg-[var(--sf-surface-muted)] p-4 text-sm font-bold text-[var(--sf-text-muted)]">
                      {t('notEnoughData')}
                    </p>
                  )}

                  <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-[var(--sf-text-muted)]">
                    <Clock3 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {t('reviewRetentionNotice')}
                  </p>
                </>
              )}
            </Panel>
          </section>
        </>
      ) : (
        <EmptyState title={t('noExamResult')} text={t('notEnoughData')} />
      )}

      {selectedQuestion && (
        <ReviewSheet
          canGoNext={selectedQuestionIndex < filteredReviewItems.length - 1}
          canGoPrevious={selectedQuestionIndex > 0}
          item={selectedQuestion}
          onClose={() => setSelectedQuestionId('')}
          onNext={() => setSelectedQuestionId(filteredReviewItems[selectedQuestionIndex + 1].questionId)}
          onPrevious={() => setSelectedQuestionId(filteredReviewItems[selectedQuestionIndex - 1].questionId)}
        />
      )}
    </PageShell>
  );
}
