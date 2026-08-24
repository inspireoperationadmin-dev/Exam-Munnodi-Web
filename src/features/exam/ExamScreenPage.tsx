import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { MathText } from '../../components/ui/MathText';
import { useLanguage } from '../../i18n/LanguageContext';
import { abandonExamSession, endExamSession, examProgressStorageKey, examSessionStorageKey, getSessionResume, submitExamAnswer } from '../../services/examService';
import type { EndSessionResult, StartSessionResult, SubmitAnswerRequest } from '../../types/exam';
import { isPracticeMode, isTimedMode as isTimedExamMode } from '../../types/exam';
import { getExamModeLabelKey } from '../../utils/examMode';
import { getErrorMessage } from '../../utils/errors';

interface StoredExamSession {
  session: StartSessionResult;
  clientStartedAt: number;
  paperTitle?: string;
  backPath?: string;
}

interface StoredExamProgress {
  selectedAnswers: Record<string, string>;
  timeSpentSeconds: Record<string, number>;
  revealedQuestionIds: string[];
  result?: EndSessionResult;
}

function readStoredSession(sessionId: string): StoredExamSession | null {
  const raw = localStorage.getItem(examSessionStorageKey(sessionId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredExamSession | StartSessionResult;
    if ('session' in parsed) return parsed;

    return {
      session: parsed,
      clientStartedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

function readStoredProgress(sessionId: string): StoredExamProgress {
  const raw = localStorage.getItem(examProgressStorageKey(sessionId));
  if (!raw) {
    return {
      selectedAnswers: {},
      timeSpentSeconds: {},
      revealedQuestionIds: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredExamProgress;
    return {
      selectedAnswers: parsed.selectedAnswers || {},
      timeSpentSeconds: parsed.timeSpentSeconds || {},
      revealedQuestionIds: parsed.revealedQuestionIds || [],
      result: parsed.result,
    };
  } catch {
    return {
      selectedAnswers: {},
      timeSpentSeconds: {},
      revealedQuestionIds: [],
    };
  }
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseServerDateMs(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  const trimmedFraction = trimmed.replace(/(\.\d{3})\d+/, '$1');
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(trimmedFraction)
    ? trimmedFraction
    : `${trimmedFraction}Z`;
  const parsed = new Date(normalized).getTime();

  return Number.isFinite(parsed) ? parsed : null;
}

function sameId(first?: string | null, second?: string | null) {
  return Boolean(first && second && first.toLowerCase() === second.toLowerCase());
}

function questionStatusClass(active: boolean, answered: boolean) {
  if (active) return 'bg-[var(--sf-primary)] text-[var(--sf-primary-text)] shadow-[var(--sf-shadow-sm)]';
  if (answered) return 'bg-[var(--sf-text-soft)] text-[var(--sf-surface)]';
  return 'border border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]';
}

export function ExamScreenPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const backPathParam = searchParams.get('backPath');
  const initialProgress = useMemo(() => (sessionId ? readStoredProgress(sessionId) : readStoredProgress('')), [sessionId]);
  const [stored, setStored] = useState<StoredExamSession | null>(() => (sessionId ? readStoredSession(sessionId) : null));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(initialProgress.selectedAnswers);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<Record<string, number>>(initialProgress.timeSpentSeconds);
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<Set<string>>(
    () => new Set(initialProgress.revealedQuestionIds),
  );
  const [result, setResult] = useState<EndSessionResult | null>(initialProgress.result || null);
  const [error, setError] = useState('');
  const [loadingResume, setLoadingResume] = useState(Boolean(sessionId && !stored));
  const [savingQuestionId, setSavingQuestionId] = useState('');
  const [confirmIntent, setConfirmIntent] = useState<'submit' | 'finishPractice' | 'exit' | null>(null);
  const [leavingSession, setLeavingSession] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const questionEnteredAtRef = useRef(Date.now());
  const questionScrollRef = useRef<HTMLDivElement | null>(null);
  const endingRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    setLoadingResume(true);

    getSessionResume(sessionId)
      .then((resume) => {
        if (!active) return;

        if (!resume.isResumable || !resume.session) {
          if (resume.status === 'Completed' || resume.status === 'TimedOut') {
            navigate(`/exam-result?sessionId=${encodeURIComponent(sessionId)}`, { replace: true });
            return;
          }

          setError(resume.title || t('sessionClosed'));
          return;
        }

        const selected: Record<string, string> = {};
        const timeSpent: Record<string, number> = {};

        resume.responses.forEach((response) => {
          if (response.selectedOptionId) {
            selected[response.questionId] = response.selectedOptionId;
          }
          timeSpent[response.questionId] = response.timeSpentSeconds;
        });

        setSelectedAnswers(selected);
        setTimeSpentSeconds(timeSpent);
        setStored({
          session: resume.session,
          clientStartedAt: Date.now(),
          paperTitle: resume.title || undefined,
          backPath: readStoredSession(sessionId)?.backPath || backPathParam || undefined,
        });

        localStorage.setItem(examSessionStorageKey(sessionId), JSON.stringify({
          session: resume.session,
          clientStartedAt: Date.now(),
          paperTitle: resume.title || undefined,
          backPath: readStoredSession(sessionId)?.backPath || backPathParam || undefined,
        }));
      })
      .catch((resumeError) => {
        if (active && !readStoredSession(sessionId)) {
          setError(getErrorMessage(resumeError, t('noExamSession')));
        }
      })
      .finally(() => {
        if (active) setLoadingResume(false);
      });

    return () => {
      active = false;
    };
  }, [backPathParam, navigate, sessionId, t]);

  const session = stored?.session;
  const questions = useMemo(
    () => [...(session?.questions || [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [session?.questions],
  );
  const currentQuestion = questions[currentIndex];
  const isPractice = isPracticeMode(session?.mode);
  const isTimedMode = isTimedExamMode(session?.mode);
  const answeredCount = questions.filter((question) => selectedAnswers[question.id]).length;

  const remainingSeconds = useMemo(() => {
    if (!stored?.session.expiresAt) return null;

    const serverNowMs = parseServerDateMs(stored.session.serverNow);
    const expiresAtMs = parseServerDateMs(stored.session.expiresAt);

    if (serverNowMs === null || expiresAtMs === null) {
      if (!stored.session.timeLimitMinutes) return null;

      const elapsedSeconds = Math.floor((now - stored.clientStartedAt) / 1000);
      return Math.max(0, (stored.session.timeLimitMinutes * 60) - elapsedSeconds);
    }

    const estimatedServerNow = serverNowMs + (now - stored.clientStartedAt);
    return Math.max(0, Math.ceil((expiresAtMs - estimatedServerNow) / 1000));
  }, [now, stored]);

  useEffect(() => {
    questionEnteredAtRef.current = Date.now();
    questionScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentIndex]);

  useEffect(() => {
    if (!sessionId) return;

    const progress: StoredExamProgress = {
      selectedAnswers,
      timeSpentSeconds,
      revealedQuestionIds: [...revealedQuestionIds],
      result: result || undefined,
    };
    localStorage.setItem(examProgressStorageKey(sessionId), JSON.stringify(progress));
  }, [revealedQuestionIds, result, selectedAnswers, sessionId, timeSpentSeconds]);

  useEffect(() => {
    if (!isTimedMode || result) return undefined;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isTimedMode, result]);

  const buildSubmittedAnswers = useCallback(
    (extraTimeByQuestion: Record<string, number> = {}): SubmitAnswerRequest[] => (
      questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: selectedAnswers[question.id] || null,
        timeSpentSeconds: Math.max(0, Math.round(extraTimeByQuestion[question.id] ?? timeSpentSeconds[question.id] ?? 0)),
      }))
    ),
    [questions, selectedAnswers, timeSpentSeconds],
  );

  const addCurrentQuestionTime = useCallback(() => {
    if (!currentQuestion) return {};

    const elapsedSeconds = Math.max(0, Math.round((Date.now() - questionEnteredAtRef.current) / 1000));
    const nextTime = {
      ...timeSpentSeconds,
      [currentQuestion.id]: (timeSpentSeconds[currentQuestion.id] || 0) + elapsedSeconds,
    };
    setTimeSpentSeconds(nextTime);
    questionEnteredAtRef.current = Date.now();
    return nextTime;
  }, [currentQuestion, timeSpentSeconds]);

  const finishSession = useCallback(
    async () => {
      if (!sessionId || endingRef.current || result) return;

      endingRef.current = true;
      setEndingSession(true);
      setError('');

      try {
        const finalTimeSpent = addCurrentQuestionTime();
        const ended = await endExamSession(sessionId, buildSubmittedAnswers(finalTimeSpent));
        setResult(ended);
        navigate(`/exam-result?sessionId=${encodeURIComponent(sessionId)}`);
      } catch (finishError) {
        setError(getErrorMessage(finishError, 'Could not finish the session.'));
        endingRef.current = false;
        setEndingSession(false);
      }
    },
    [addCurrentQuestionTime, buildSubmittedAnswers, navigate, result, sessionId],
  );

  useEffect(() => {
    if (!isTimedMode || result || remainingSeconds === null || remainingSeconds > 0) return;
    void finishSession();
  }, [finishSession, isTimedMode, remainingSeconds, result]);

  if (!sessionId) {
    return <Navigate to="/" replace />;
  }

  if (loadingResume && !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--sf-page)] px-4 text-[var(--sf-text)]">
        <section className="w-full max-w-md rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 text-center shadow-[var(--sf-shadow-sm)]">
          <h1 className="text-xl font-black text-[var(--sf-text)]">{t('loading')}</h1>
        </section>
      </main>
    );
  }

  if (!session || !questions.length || !currentQuestion) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--sf-page)] px-4 text-[var(--sf-text)]">
        <section className="w-full max-w-md rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 text-center shadow-[var(--sf-shadow-sm)]">
          <h1 className="text-xl font-black text-[var(--sf-text)]">{t('noExamSession')}</h1>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[var(--sf-primary)] px-4 text-sm font-black text-[var(--sf-primary-text)]"
            to="/"
          >
            {t('backToHome')}
          </Link>
        </section>
      </main>
    );
  }

  if (result) {
    return <Navigate to={`/exam-result?sessionId=${encodeURIComponent(sessionId)}`} replace />;
  }

  const activeSessionId = sessionId;
  const backPath = stored?.backPath || backPathParam || '/';
  const currentSelectedOptionId = selectedAnswers[currentQuestion.id] || '';
  const isCurrentRevealed = revealedQuestionIds.has(currentQuestion.id);
  const currentCorrect = sameId(currentQuestion.correctOptionId, currentSelectedOptionId);

  function goToQuestion(nextIndex: number) {
    addCurrentQuestionTime();
    setCurrentIndex(Math.min(Math.max(nextIndex, 0), questions.length - 1));
    setNavigatorOpen(false);
  }

  async function selectAnswer(optionId: string) {
    if (result || (isPractice && isCurrentRevealed)) return;

    const elapsedSeconds = Math.max(0, Math.round((Date.now() - questionEnteredAtRef.current) / 1000));
    const nextTimeSpent = (timeSpentSeconds[currentQuestion.id] || 0) + elapsedSeconds;
    questionEnteredAtRef.current = Date.now();
    setError('');
    setSavingQuestionId(currentQuestion.id);
    setSelectedAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionId }));
    setTimeSpentSeconds((previous) => ({ ...previous, [currentQuestion.id]: nextTimeSpent }));

    try {
      await submitExamAnswer(activeSessionId, {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        timeSpentSeconds: nextTimeSpent,
      });
    } catch (answerError) {
      setError(getErrorMessage(answerError, 'Could not save this answer.'));
    } finally {
      setSavingQuestionId('');
    }
  }

  function revealExplanation() {
    if (!currentSelectedOptionId) return;
    setRevealedQuestionIds((previous) => new Set(previous).add(currentQuestion.id));
  }

  function leaveExam() {
    if (!result) {
      setConfirmIntent('exit');
      return;
    }
    navigate(backPath);
  }

  function requestFinishSession() {
    if (isTimedMode) {
      setConfirmIntent('submit');
      return;
    }

    setConfirmIntent('finishPractice');
  }

  async function persistCurrentPracticeActivity() {
    if (!sessionId || !currentQuestion) return;

    const elapsedSeconds = Math.max(0, Math.round((Date.now() - questionEnteredAtRef.current) / 1000));
    const nextTimeSpent = (timeSpentSeconds[currentQuestion.id] || 0) + elapsedSeconds;
    questionEnteredAtRef.current = Date.now();
    setTimeSpentSeconds((previous) => ({ ...previous, [currentQuestion.id]: nextTimeSpent }));

    await submitExamAnswer(sessionId, {
      questionId: currentQuestion.id,
      selectedOptionId: selectedAnswers[currentQuestion.id] || null,
      timeSpentSeconds: nextTimeSpent,
    });
  }

  async function confirmDialogAction() {
    const intent = confirmIntent;
    setConfirmIntent(null);

    if (intent === 'submit' || intent === 'finishPractice') {
      void finishSession();
      return;
    }

    if (intent === 'exit') {
      setLeavingSession(true);
      setError('');

      try {
        if (isPractice) {
          await persistCurrentPracticeActivity();
        } else if (isTimedMode) {
          await abandonExamSession(activeSessionId);
          localStorage.removeItem(examSessionStorageKey(activeSessionId));
          localStorage.removeItem(examProgressStorageKey(activeSessionId));
        }

        navigate(backPath);
      } catch (leaveError) {
        setError(getErrorMessage(leaveError, 'Could not leave this session. Please try again.'));
      } finally {
        setLeavingSession(false);
      }
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[var(--sf-page)] text-[var(--sf-text)]">
      <section className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:px-5">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <button
            className="inline-flex h-10 items-center rounded-md border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-3 text-sm font-black text-[var(--sf-text-soft)] transition hover:bg-[var(--sf-surface-muted)]"
            onClick={leaveExam}
            type="button"
          >
            {t('leaveSession')}
          </button>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--sf-text-muted)]">
              {t(getExamModeLabelKey(session.mode))}
            </p>
            {isTimedMode && (
              <p className="mt-1 text-sm font-black tabular-nums text-[var(--sf-text)]">
                {formatClock(remainingSeconds ?? 0)}
              </p>
            )}
          </div>
        </header>

        {error && <AlertMessage>{error}</AlertMessage>}

        <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-sm)]">
            <div ref={questionScrollRef} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sf-border)] pb-3 sm:pb-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-[var(--sf-text-muted)]">
                        {t('questionNumber')} {currentIndex + 1} {t('of')} {questions.length}
                      </p>
                    </div>
                    {isTimedMode && (
                      <div className="hidden rounded-md bg-[var(--sf-primary)] px-4 py-2 text-right text-[var(--sf-primary-text)] sm:block">
                        <p className="text-xs font-bold opacity-75">{t('timeLeft')}</p>
                        <p className="text-xl font-black tabular-nums">{formatClock(remainingSeconds ?? 0)}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 min-w-0">
                    <div className="min-w-0">
                      <MathText
                        className="block break-words text-base font-black leading-8 text-[var(--sf-text)] [overflow-wrap:anywhere] sm:text-lg"
                        text={currentQuestion.questionText}
                      />
                      {currentQuestion.questionImageUrl && (
                        <img
                          alt=""
                          className="mt-4 max-h-96 w-full rounded-md border border-[var(--sf-border)] object-contain"
                          src={currentQuestion.questionImageUrl}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {currentQuestion.options.map((option) => {
                      const selected = currentSelectedOptionId === option.id;
                      const correct = sameId(currentQuestion.correctOptionId, option.id);
                      const revealCorrect = isPractice && isCurrentRevealed && correct;
                      const revealWrong = isPractice && isCurrentRevealed && selected && !correct;

                      return (
                        <button
                          className={[
                            'min-w-0 rounded-md border p-3 text-left transition disabled:cursor-not-allowed',
                            selected ? 'border-[var(--sf-selected-border)] bg-[var(--sf-selected-soft)] ring-2 ring-[var(--sf-selected-focus)]' : 'border-[var(--sf-border)] bg-[var(--sf-surface-muted)] hover:border-[var(--sf-border-strong)]',
                            revealCorrect ? 'border-[var(--sf-success-text)] bg-[var(--sf-success-soft)] ring-2 ring-[var(--sf-focus)]' : '',
                            revealWrong ? 'border-[var(--sf-danger)] bg-[var(--sf-danger-soft)]' : '',
                          ].join(' ')}
                          disabled={Boolean(result) || (isPractice && isCurrentRevealed)}
                          key={option.id}
                          onClick={() => void selectAnswer(option.id)}
                          type="button"
                        >
                          <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3">
                            <span className={`font-black ${revealCorrect ? 'text-[var(--sf-success-text)]' : 'text-[var(--sf-text-soft)]'}`}>
                              {option.label}
                            </span>
                            <div className="min-w-0">
                              {revealCorrect && (
                                <span className="mb-2 inline-flex rounded-md bg-[var(--sf-primary)] px-2 py-1 text-xs font-black text-[var(--sf-primary-text)]">
                                  {t('correctAnswer')}
                                </span>
                              )}
                              <MathText
                                className={`block break-words text-sm font-bold leading-7 [overflow-wrap:anywhere] ${revealCorrect ? 'text-[var(--sf-success-text)]' : 'text-[var(--sf-text)]'}`}
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
                        </button>
                      );
                    })}
                  </div>

                  {isPractice && (
                    <section className="mt-5 rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-4">
                      <button
                        className="h-11 rounded-md bg-[var(--sf-primary)] px-4 text-sm font-black text-[var(--sf-primary-text)] disabled:cursor-not-allowed disabled:bg-[var(--sf-border-strong)] disabled:text-[var(--sf-text-muted)]"
                        disabled={!currentSelectedOptionId || isCurrentRevealed}
                        onClick={revealExplanation}
                        type="button"
                      >
                        {t('seeExplanation')}
                      </button>

                      {!currentSelectedOptionId && (
                        <p className="mt-3 text-sm font-bold text-[var(--sf-text-muted)]">{t('selectAnswerFirst')}</p>
                      )}

                      {isCurrentRevealed && (
                        <div className="mt-4">
                          <p className={`text-sm font-black ${currentCorrect ? 'text-[var(--sf-success-text)]' : 'text-[var(--sf-danger-text)]'}`}>
                            {currentCorrect ? t('correctAnswer') : t('wrongAnswer')}
                          </p>
                          <h2 className="mt-3 text-base font-black text-[var(--sf-text)]">{t('explanation')}</h2>
                          <MathText
                            className="mt-2 block break-words text-sm font-semibold leading-7 text-[var(--sf-text-soft)] [overflow-wrap:anywhere]"
                            text={currentQuestion.explanationText || '-'}
                          />
                        </div>
                      )}
                    </section>
                  )}

                  {savingQuestionId === currentQuestion.id && (
                    <p className="mt-3 text-xs font-bold text-[var(--sf-text-muted)]">{t('saving')}</p>
                  )}
              </>
            </div>

            {!result && (
              <footer className="shrink-0 border-t border-[var(--sf-border)] bg-[var(--sf-surface)] p-3">
                <div className="grid grid-cols-3 gap-2 lg:flex lg:justify-between">
                  <button
                    className="h-11 rounded-md border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-4 text-sm font-black text-[var(--sf-text-soft)] disabled:cursor-not-allowed disabled:bg-[var(--sf-surface-muted)] disabled:text-[var(--sf-text-muted)]"
                    disabled={currentIndex === 0}
                    onClick={() => goToQuestion(currentIndex - 1)}
                    type="button"
                  >
                    {t('previous')}
                  </button>
                  <button
                    className="h-11 rounded-md border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-3 text-sm font-black text-[var(--sf-text-soft)] lg:hidden"
                    onClick={() => setNavigatorOpen(true)}
                    type="button"
                  >
                    {t('questions')}
                  </button>
                  <button
                    className="h-11 rounded-md border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-4 text-sm font-black text-[var(--sf-text-soft)] disabled:cursor-not-allowed disabled:bg-[var(--sf-surface-muted)] disabled:text-[var(--sf-text-muted)]"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => goToQuestion(currentIndex + 1)}
                    type="button"
                  >
                    {t('next')}
                  </button>
                  <button
                    className="col-span-3 h-11 rounded-md bg-[var(--sf-primary)] px-4 text-sm font-black text-[var(--sf-primary-text)] disabled:cursor-not-allowed disabled:bg-[var(--sf-border-strong)] lg:col-span-1"
                    disabled={endingRef.current}
                    onClick={requestFinishSession}
                    type="button"
                  >
                    {isPractice ? t('finishPractice') : t('submitExam')}
                  </button>
                </div>
              </footer>
            )}
          </article>

          {!result && (
            <aside className="hidden min-h-0 flex-col rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] lg:flex">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-[var(--sf-surface-muted)] p-3">
                  <p className="font-bold text-[var(--sf-text-muted)]">{t('answered')}</p>
                  <p className="mt-1 text-xl font-black text-[var(--sf-text)]">{answeredCount}</p>
                </div>
                <div className="rounded-md bg-[var(--sf-surface-muted)] p-3">
                  <p className="font-bold text-[var(--sf-text-muted)]">{t('unanswered')}</p>
                  <p className="mt-1 text-xl font-black text-[var(--sf-text)]">{questions.length - answeredCount}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 border-y border-[var(--sf-border)] py-3 text-xs font-bold text-[var(--sf-text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[var(--sf-primary)]" />
                  {t('current')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[var(--sf-text-soft)]" />
                  {t('answered')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
                  {t('unanswered')}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-2 overflow-y-auto pr-1 lg:grid-cols-4">
                {questions.map((question, index) => {
                  const answered = Boolean(selectedAnswers[question.id]);
                  const active = index === currentIndex;
                  return (
                    <button
                      className={`h-10 rounded-md text-sm font-black transition ${questionStatusClass(active, answered)}`}
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}
        </section>
      </section>
      {navigatorOpen && (
        <div className="fixed inset-0 z-40 grid place-items-end bg-[var(--sf-scrim)] px-3 pb-3 lg:hidden">
          <section className="max-h-[78vh] w-full overflow-hidden rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-md)]">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--sf-border)] p-4">
              <div>
                <h2 className="text-base font-black text-[var(--sf-text)]">{t('questions')}</h2>
                <p className="mt-1 text-xs font-bold text-[var(--sf-text-muted)]">
                  {answeredCount} {t('answered')} / {questions.length}
                </p>
              </div>
              <button
                aria-label={t('close')}
                className="grid h-9 w-9 place-items-center rounded-md border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] text-sm font-black text-[var(--sf-text-soft)]"
                onClick={() => setNavigatorOpen(false)}
                type="button"
              >
                X
              </button>
            </header>
            <div className="flex flex-wrap gap-3 border-b border-[var(--sf-border)] px-4 py-3 text-xs font-bold text-[var(--sf-text-muted)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-[var(--sf-primary)]" />
                {t('current')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-[var(--sf-text-soft)]" />
                {t('answered')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
                {t('unanswered')}
              </span>
            </div>
            <div className="max-h-[calc(78vh-120px)] overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const answered = Boolean(selectedAnswers[question.id]);
                  const active = index === currentIndex;
                  return (
                    <button
                      className={`h-10 rounded-md text-sm font-black transition ${questionStatusClass(active, answered)}`}
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}
      <ConfirmDialog
        cancelLabel={t('cancel')}
        confirmLabel={confirmIntent === 'submit' ? t('submitExam') : confirmIntent === 'finishPractice' ? t('finishPractice') : leavingSession ? t('loading') : t('leaveSession')}
        danger={confirmIntent === 'exit'}
        message={confirmIntent === 'submit' ? t('submitConfirm') : confirmIntent === 'finishPractice' ? t('finishPracticeConfirm') : isPractice ? t('exitPracticeConfirm') : t('exitTimedExamConfirm')}
        onCancel={() => {
          if (!leavingSession) setConfirmIntent(null);
        }}
        onConfirm={() => {
          if (!leavingSession) void confirmDialogAction();
        }}
        open={confirmIntent !== null}
        title={confirmIntent === 'submit' ? t('submitExam') : confirmIntent === 'finishPractice' ? t('finishPractice') : t('leaveSession')}
      />
      <LoadingOverlay
        label={leavingSession ? t('leavingExam') : t('submittingExam')}
        open={endingSession || leavingSession}
      />
    </main>
  );
}
