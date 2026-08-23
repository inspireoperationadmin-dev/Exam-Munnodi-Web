import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock3, FileQuestion, X } from 'lucide-react';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button, ButtonLink } from '../../components/ui/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import type { PaperSummary } from '../../types/academic';
import type { ExamSessionSummary, PaperSessionMode } from '../../types/exam';

interface PaperActionSheetProps {
  error: string;
  onClose: () => void;
  onContinue: (session: ExamSessionSummary) => void;
  onStart: (mode: PaperSessionMode, replaceSessionId?: string) => void;
  open: boolean;
  paper: PaperSummary | null;
  resumableSession: ExamSessionSummary | null;
  startingMode: PaperSessionMode | 'fresh' | null;
}

export function PaperActionSheet({
  error,
  onClose,
  onContinue,
  onStart,
  open,
  paper,
  resumableSession,
  startingMode,
}: PaperActionSheetProps) {
  const { t } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(startingMode !== null);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  onCloseRef.current = onClose;
  busyRef.current = startingMode !== null;

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }

    if (!rendered) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleDialogKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = [...(sheetRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleDialogKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleDialogKey);
      previousFocus?.focus();
    };
  }, [open]);

  if (!rendered || !paper) return null;

  const hasPausedPractice = resumableSession?.mode === 'PaperPractice';

  return (
    <div
      aria-labelledby="paper-action-sheet-title"
      aria-modal="true"
      className={`fixed inset-0 z-60 flex items-end justify-center bg-[var(--sf-scrim)] sm:items-center sm:p-4 ${closing ? 'sf-sheet-backdrop-exit' : 'sf-sheet-backdrop-enter'}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && startingMode === null) onClose();
      }}
      role="dialog"
    >
      <section
        className={`w-full rounded-t-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[var(--sf-shadow-lg)] sm:max-w-lg sm:rounded-2xl sm:p-5 ${closing ? 'sf-sheet-exit' : 'sf-sheet-enter'}`}
        ref={sheetRef}
      >
        <div aria-hidden="true" className="mx-auto mb-2 h-1 w-12 rounded-full bg-[var(--sf-border-strong)] sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[var(--sf-brand)]">
              {paper.type === 'ModelPaper' ? t('modelPaper') : t('pastPaper')}
            </p>
            <h2 className="mt-1 text-xl font-black leading-7 text-[var(--sf-text)]" id="paper-action-sheet-title">
              {paper.year} {paper.type === 'ModelPaper' ? t('modelPaper') : t('pastPaper')}
            </h2>
          </div>
          <button
            aria-label={t('close')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)]"
            disabled={startingMode !== null}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[var(--sf-surface-muted)] p-3 text-center">
            <CalendarDays aria-hidden="true" className="mx-auto h-5 w-5 text-[var(--sf-brand)]" />
            <dt className="mt-2 text-xs font-bold text-[var(--sf-text-muted)]">{t('year')}</dt>
            <dd className="mt-1 text-base font-black text-[var(--sf-text)]">{paper.year}</dd>
          </div>
          <div className="rounded-xl bg-[var(--sf-surface-muted)] p-3 text-center">
            <FileQuestion aria-hidden="true" className="mx-auto h-5 w-5 text-[var(--sf-brand)]" />
            <dt className="mt-2 text-xs font-bold text-[var(--sf-text-muted)]">{t('questions')}</dt>
            <dd className="mt-1 text-base font-black text-[var(--sf-text)]">{paper.questionCount}</dd>
          </div>
          <div className="rounded-xl bg-[var(--sf-surface-muted)] p-3 text-center">
            <Clock3 aria-hidden="true" className="mx-auto h-5 w-5 text-[var(--sf-brand)]" />
            <dt className="mt-2 text-xs font-bold text-[var(--sf-text-muted)]">{t('time')}</dt>
            <dd className="mt-1 text-base font-black text-[var(--sf-text)]">{paper.timeLimit} {t('minutesShort')}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[var(--sf-text-muted)]">
          {paper.sitting && <span className="rounded-md bg-[var(--sf-surface-muted)] px-2 py-1">{paper.sitting}</span>}
          {resumableSession && <span className="rounded-md bg-[var(--sf-success-soft)] px-2 py-1 text-[var(--sf-success-text)]">{t('resumeAvailable')}</span>}
        </div>

        {(paper.lockReason || error) && (
          <div className="mt-4 grid gap-2">
            {paper.lockReason && <p className="text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">{paper.lockReason}</p>}
            {error && <AlertMessage>{error}</AlertMessage>}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {resumableSession ? (
            <>
              {hasPausedPractice && (
                <Button
                  disabled={startingMode !== null}
                  onClick={() => onStart('PaperPractice', resumableSession.sessionId)}
                  type="button"
                  variant="secondary"
                >
                  {startingMode === 'fresh' ? t('loading') : t('startFresh')}
                </Button>
              )}
              <Button
                className={hasPausedPractice ? '' : 'col-span-2'}
                disabled={startingMode !== null}
                onClick={() => onContinue(resumableSession)}
                type="button"
              >
                {t('continue')}
              </Button>
            </>
          ) : paper.isLocked ? (
            <ButtonLink className="col-span-2 w-full" to="/subscription" variant="primary">{t('viewPlans')}</ButtonLink>
          ) : (
            <>
              {paper.canPractice ? (
                <Button disabled={startingMode !== null} onClick={() => onStart('PaperPractice')} type="button">
                  {startingMode === 'PaperPractice' ? t('loading') : t('startPractice')}
                </Button>
              ) : (
                <ButtonLink className="w-full" to="/subscription" variant="primary">{t('unlockPaper')}</ButtonLink>
              )}
              {paper.canUseExamMode ? (
                <Button disabled={startingMode !== null} onClick={() => onStart('PaperExam')} type="button" variant="secondary">
                  {startingMode === 'PaperExam' ? t('loading') : t('startExam')}
                </Button>
              ) : (
                <ButtonLink className="w-full" to="/subscription" variant="secondary">{t('unlockExamMode')}</ButtonLink>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
