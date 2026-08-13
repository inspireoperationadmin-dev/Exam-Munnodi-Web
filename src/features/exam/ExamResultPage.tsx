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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-3 py-4">
      <article className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              {t('questionNumber')} {item.orderIndex}
            </p>
            <p className={`mt-1 text-sm font-black ${item.isCorrect ? 'text-emerald-700' : item.selectedOptionId ? 'text-red-700' : 'text-slate-500'}`}>
              {item.isCorrect ? t('correctAnswer') : item.selectedOptionId ? t('wrongAnswer') : t('unanswered')}
            </p>
          </div>
          <button
            aria-label={t('close')}
            className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            X
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
              {item.marksAwarded} {t('score')}
            </span>
          </div>

          <div className="mt-5 flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-700 text-sm font-black text-white">
              {item.orderIndex}
            </span>
            <div className="min-w-0 flex-1">
              <MathText
                className="block break-words text-lg font-black leading-8 text-slate-950 [overflow-wrap:anywhere]"
                text={item.questionText}
              />
              {item.questionImageUrl && (
                <img
                  alt=""
                  className="mt-4 max-h-96 w-full rounded-md border border-slate-200 object-contain"
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
                    correct ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-slate-50',
                    wrongSelected ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : '',
                  ].join(' ')}
                  key={option.id}
                >
                  <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3">
                    <span className={`font-black ${correct ? 'text-emerald-800' : wrongSelected ? 'text-red-700' : 'text-slate-800'}`}>
                      {option.label}
                    </span>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {correct && (
                          <span className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-black text-white">
                            {t('correctAnswer')}
                          </span>
                        )}
                        {selected && (
                          <span className={`rounded-md px-2 py-1 text-xs font-black text-white ${wrongSelected ? 'bg-red-600' : 'bg-slate-700'}`}>
                            {t('selectedAnswer')}
                          </span>
                        )}
                      </div>
                      <MathText
                        className="block break-words text-sm font-bold leading-6 text-slate-900 [overflow-wrap:anywhere]"
                        text={option.optionText}
                      />
                      {option.optionImageUrl && (
                        <img
                          alt=""
                          className="mt-3 max-h-64 w-full rounded-md border border-slate-200 object-contain"
                          src={option.optionImageUrl}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-black text-slate-950">{t('explanation')}</h2>
            {item.explanation?.sections.length ? (
              <div className="mt-3 grid gap-4">
                {item.explanation.sections
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((section) => (
                    <section key={`${item.questionId}-${section.orderIndex}`}>
                      <h3 className="text-sm font-black text-slate-950">{section.title}</h3>
                      <MathText
                        className="mt-1 block break-words text-sm font-semibold leading-7 text-slate-700 [overflow-wrap:anywhere]"
                        text={section.content}
                      />
                    </section>
                  ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-bold text-slate-500">{t('noExplanation')}</p>
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

  const subjectPath = detail?.subjectId ? `/subject?subjectId=${encodeURIComponent(detail.subjectId)}` : '/';
  const backPath = detail?.paperId
    ? `/paper-preview?paperId=${encodeURIComponent(detail.paperId)}`
    : subjectPath;
  const backLabel = detail?.paperId ? t('backToPreview') : t('backToSubject');
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
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
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
                  <p className="text-sm font-black uppercase tracking-wide text-slate-500">{t('examResult')}</p>
                  <h1 className="mt-1 break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                    {detail.paperTitle || modeLabel}
                  </h1>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {t('time')}: {formatSeconds(timeTakenSeconds)}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-700 p-4 text-white">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-300">{t('score')}</p>
                  <p className="mt-1 text-4xl font-black">{Math.round(detail.percentage)}%</p>
                  <p className="mt-1 text-sm font-bold text-slate-300">
                    {detail.obtainedMarks} / {detail.totalMarks}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-bold text-slate-500">{t('correctAnswer')}</dt>
                  <dd className="mt-1 text-xl font-black text-slate-900">{detail.correctCount}</dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="font-bold text-slate-500">{t('wrongAnswer')}</dt>
                  <dd className="mt-1 text-xl font-black text-slate-900">{detail.wrongCount}</dd>
                </div>
                <div className="rounded-md bg-slate-100 p-3">
                  <dt className="font-bold text-slate-600">{t('unanswered')}</dt>
                  <dd className="mt-1 text-xl font-black text-slate-800">{detail.skippedCount}</dd>
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
                  <ButtonLink to={subjectPath}>
                    {t('backToSubject')}
                  </ButtonLink>
                </div>
              )}
            </Panel>

            <Panel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-black text-slate-950">{t('questions')}</h2>
                <p className="text-xs font-bold text-slate-500">{t('selectQuestionReview')}</p>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {reviewItems.map((item) => {
                  const answered = Boolean(item.selectedOptionId);
                  return (
                    <button
                      className={[
                        'h-11 rounded-md text-sm font-black transition',
                        item.isCorrect ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : answered ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
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
