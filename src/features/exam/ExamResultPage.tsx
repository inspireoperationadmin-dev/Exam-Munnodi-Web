import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, LoadingPanel, PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { MathText } from '../../components/ui/MathText';
import { useLanguage } from '../../i18n/LanguageContext';
import { getSessionDetail, getSessionReview } from '../../services/examService';
import type { SessionDetail, SessionReviewItem } from '../../types/exam';
import { getExamModeLabelKey } from '../../utils/examMode';
import { getErrorMessage } from '../../utils/errors';

function sameId(first?: string | null, second?: string | null) {
  return Boolean(first && second && first.toLowerCase() === second.toLowerCase());
}

function formatSeconds(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

interface ReviewModalProps {
  item: SessionReviewItem;
  onClose: () => void;
}

function ReviewModal({ item, onClose }: ReviewModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--sf-scrim)] px-3 py-4">
      <article className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-md)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--sf-border)] p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--sf-text-muted)]">
              {t('questionNumber')} {item.orderIndex}
            </p>
            <p className={`mt-1 text-sm font-black ${item.isCorrect ? 'text-[var(--sf-success-text)]' : item.selectedOptionId ? 'text-[var(--sf-danger-text)]' : 'text-[var(--sf-text-muted)]'}`}>
              {item.isCorrect ? t('correctAnswer') : item.selectedOptionId ? t('wrongAnswer') : t('unanswered')}
            </p>
          </div>
          <button
            aria-label={t('close')}
            className="grid h-9 w-9 place-items-center rounded-md border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] text-sm font-black text-[var(--sf-text-soft)] transition hover:bg-[var(--sf-surface-muted)]"
            onClick={onClose}
            type="button"
          >
            X
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sf-border)] pb-4">
            <span className="rounded-md bg-[var(--sf-surface-muted)] px-3 py-2 text-sm font-black text-[var(--sf-text-soft)]">
              {item.marksAwarded} {t('score')}
            </span>
          </div>

          <div className="mt-5 flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--sf-primary)] text-sm font-black text-[var(--sf-primary-text)]">
              {item.orderIndex}
            </span>
            <div className="min-w-0 flex-1">
              <MathText
                className="block break-words text-lg font-black leading-8 text-[var(--sf-text)] [overflow-wrap:anywhere]"
                text={item.questionText}
              />
              {item.questionImageUrl && (
                <img
                  alt=""
                  className="mt-4 max-h-96 w-full rounded-md border border-[var(--sf-border)] object-contain"
                  src={item.questionImageUrl}
                />
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {item.options.map((option) => {
              const selected = sameId(item.selectedOptionId, option.id);
              const correct = option.isCorrect || sameId(item.correctOptionId, option.id);
              const wrongSelected = selected && !correct;

              return (
                <div
                  className={[
                    'min-w-0 rounded-md border p-3',
                    correct ? 'border-[var(--sf-success-text)] bg-[var(--sf-success-soft)] ring-2 ring-[var(--sf-focus)]' : 'border-[var(--sf-border)] bg-[var(--sf-surface-muted)]',
                    wrongSelected ? 'border-[var(--sf-danger)] bg-[var(--sf-danger-soft)] ring-2 ring-[var(--sf-danger-border)]' : '',
                  ].join(' ')}
                  key={option.id}
                >
                  <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3">
                    <span className={`font-black ${correct ? 'text-[var(--sf-success-text)]' : wrongSelected ? 'text-[var(--sf-danger-text)]' : 'text-[var(--sf-text-soft)]'}`}>
                      {option.label}
                    </span>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {correct && (
                          <span className="rounded-md bg-[var(--sf-primary)] px-2 py-1 text-xs font-black text-[var(--sf-primary-text)]">
                            {t('correctAnswer')}
                          </span>
                        )}
                        {selected && (
                          <span className={`rounded-md px-2 py-1 text-xs font-black ${wrongSelected ? 'bg-[var(--sf-danger)] text-[var(--sf-danger-on)]' : 'bg-[var(--sf-text-soft)] text-[var(--sf-surface)]'}`}>
                            {t('selectedAnswer')}
                          </span>
                        )}
                      </div>
                      <MathText
                        className="block break-words text-sm font-bold leading-6 text-[var(--sf-text)] [overflow-wrap:anywhere]"
                        text={option.optionText}
                      />
                      {option.optionImageUrl && (
                        <img
                          alt=""
                          className="mt-3 max-h-64 w-full rounded-md border border-[var(--sf-border)] object-contain"
                          src={option.optionImageUrl}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="mt-5 rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-4">
            <h2 className="text-base font-black text-[var(--sf-text)]">{t('explanation')}</h2>
            {item.explanation?.sections.length ? (
              <div className="mt-3 grid gap-4">
                {item.explanation.sections
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((section) => (
                    <section key={`${item.questionId}-${section.orderIndex}`}>
                      <h3 className="text-sm font-black text-[var(--sf-text)]">{section.title}</h3>
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
      </article>
    </div>
  );
}

export function ExamResultPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [reviewItems, setReviewItems] = useState<SessionReviewItem[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([getSessionDetail(sessionId), getSessionReview(sessionId)])
      .then(([sessionDetail, review]) => {
        if (!active) return;

        setDetail(sessionDetail);
        setReviewItems([...review].sort((a, b) => a.orderIndex - b.orderIndex));
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, 'Could not load exam result.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId]);

  const selectedQuestion = useMemo(
    () => reviewItems.find((item) => item.questionId === selectedQuestionId) || null,
    [reviewItems, selectedQuestionId],
  );

  if (!sessionId) {
    return <Navigate to="/" replace />;
  }

  const subjectPath = detail?.subjectId ? `/progress?subjectId=${encodeURIComponent(detail.subjectId)}` : '/';
  const backPath = detail?.paperId && detail.subjectId
    ? `/papers?subjectId=${encodeURIComponent(detail.subjectId)}`
    : subjectPath;
  const backLabel = detail?.paperId ? t('backToPapers') : t('viewProgress');
  const progressPath = detail?.subjectId ? `/progress?subjectId=${encodeURIComponent(detail.subjectId)}` : '';
  const topicsPath = detail?.subjectId ? `/topics?subjectId=${encodeURIComponent(detail.subjectId)}` : '';
  const modeLabel = t(getExamModeLabelKey(detail?.mode));
  const timeTakenSeconds = detail
    ? (new Date(detail.endTime || detail.serverNow).getTime() - new Date(detail.startTime).getTime()) / 1000
    : 0;

  return (
    <PageShell>
        <PageHeader>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-3 text-sm font-bold text-[var(--sf-text-soft)] transition hover:bg-[var(--sf-surface-muted)]"
            to={backPath}
          >
            {backLabel}
          </Link>
        </PageHeader>

        {error && <AlertMessage>{error}</AlertMessage>}

        {loading ? (
          <LoadingPanel label={t('loading')} />
        ) : detail ? (
          <>
            <Panel>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-wide text-[var(--sf-text-muted)]">{t('examResult')}</p>
                  <h1 className="mt-1 break-words text-2xl font-black leading-tight text-[var(--sf-text)] sm:text-3xl">
                    {detail.paperTitle || modeLabel}
                  </h1>
                  <p className="mt-2 text-sm font-bold text-[var(--sf-text-muted)]">
                    {t('time')}: {formatSeconds(timeTakenSeconds)}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--sf-primary)] p-4 text-[var(--sf-primary-text)]">
                  <p className="text-xs font-black uppercase tracking-wide opacity-75">{t('score')}</p>
                  <p className="mt-1 text-4xl font-black">{Math.round(detail.percentage)}%</p>
                  <p className="mt-1 text-sm font-bold opacity-75">
                    {detail.obtainedMarks} / {detail.totalMarks}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md bg-[var(--sf-surface-muted)] p-3">
                  <dt className="font-bold text-[var(--sf-text-muted)]">{t('correctAnswer')}</dt>
                  <dd className="mt-1 text-xl font-black text-[var(--sf-text)]">{detail.correctCount}</dd>
                </div>
                <div className="rounded-md bg-[var(--sf-surface-muted)] p-3">
                  <dt className="font-bold text-[var(--sf-text-muted)]">{t('wrongAnswer')}</dt>
                  <dd className="mt-1 text-xl font-black text-[var(--sf-text)]">{detail.wrongCount}</dd>
                </div>
                <div className="rounded-md bg-[var(--sf-surface-muted)] p-3">
                  <dt className="font-bold text-[var(--sf-text-muted)]">{t('unanswered')}</dt>
                  <dd className="mt-1 text-xl font-black text-[var(--sf-text)]">{detail.skippedCount}</dd>
                </div>
              </dl>

              {detail.subjectId && (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <ButtonLink to={progressPath} variant="primary">
                    {t('viewProgress')}
                  </ButtonLink>
                  <ButtonLink to={topicsPath}>
                    {t('practiceImprovementTopics')}
                  </ButtonLink>
                  <ButtonLink to="/">
                    {t('backToHome')}
                  </ButtonLink>
                </div>
              )}
            </Panel>

            <Panel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-black text-[var(--sf-text)]">{t('questions')}</h2>
                <p className="text-xs font-bold text-[var(--sf-text-muted)]">{t('selectQuestionReview')}</p>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {reviewItems.map((item) => {
                  const answered = Boolean(item.selectedOptionId);
                  return (
                    <button
                      className={[
                        'h-11 rounded-md text-sm font-black transition',
                        item.isCorrect ? 'bg-[var(--sf-success-soft)] text-[var(--sf-success-text)] hover:bg-[var(--sf-success-soft)]' : answered ? 'bg-[var(--sf-danger-soft)] text-[var(--sf-danger-text)] hover:bg-[var(--sf-danger-soft)]' : 'bg-[var(--sf-surface-muted)] text-[var(--sf-text-muted)] hover:bg-[var(--sf-progress-track)]',
                      ].join(' ')}
                      key={item.questionId}
                      onClick={() => setSelectedQuestionId(item.questionId)}
                      type="button"
                    >
                      {item.orderIndex}
                    </button>
                  );
                })}
              </div>
            </Panel>
          </>
        ) : (
          <EmptyState title={t('noExamResult')} text={t('notEnoughData')} />
        )}
      

      {selectedQuestion && (
        <ReviewModal
          item={selectedQuestion}
          onClose={() => setSelectedQuestionId('')}
        />
      )}
    </PageShell>
  );
}
