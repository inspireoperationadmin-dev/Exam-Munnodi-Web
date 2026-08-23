import { useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Eyebrow, Panel } from '../../components/ui/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import type { ExamSessionSummary } from '../../types/exam';
import { getExamModeLabelKey } from '../../utils/examMode';
import { buildSessionBackPath, formatRemainingTime, getRemainingSeconds } from './resumeSessionUtils';

interface ResumeSessionsPanelProps {
  backPath?: string;
  maxItems?: number;
  showEmptyState?: boolean;
  showAll?: boolean;
  sessions: ExamSessionSummary[];
  subjectId?: string;
  subjectScoped?: boolean;
}

function sessionTitle(session: ExamSessionSummary, fallback: string) {
  return session.paperTitle || session.subjectName || fallback;
}

export function ResumeSessionsPanel({
  backPath = '/',
  maxItems = 2,
  showEmptyState = false,
  showAll = false,
  sessions,
  subjectId,
  subjectScoped = false,
}: ResumeSessionsPanelProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!sessions.length) {
    if (!showEmptyState) return null;

    return (
      <Panel className="overflow-hidden">
        <Eyebrow>{t('pausedSessions')}</Eyebrow>
        <div className="grid justify-items-center px-2 pb-2 pt-3 text-center">
          <img
            alt=""
            aria-hidden="true"
            className="h-32 w-32 object-contain opacity-90 sm:h-36 sm:w-36"
            src="/assets/empty.svg"
          />
          <p className="mt-2 text-base font-black text-[var(--sf-text)]">{t('noPendingSessions')}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
            {t('noPendingSessionsText')}
          </p>
        </div>
      </Panel>
    );
  }

  const visibleSessions = showAll ? sessions : sessions.slice(0, maxItems);

  function resume(session: ExamSessionSummary) {
    const nextBackPath = subjectScoped ? backPath : buildSessionBackPath(session, backPath);
    navigate(`/exam?sessionId=${encodeURIComponent(session.sessionId)}&backPath=${encodeURIComponent(nextBackPath)}`);
  }

  return (
    <Panel>
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>{t('pausedSessions')}</Eyebrow>
            <h2 className="mt-1 text-lg font-black text-[var(--sf-text)]">{t('continuePausedWork')}</h2>
          </div>
          {!showAll && sessions.length > maxItems && (
            <ButtonLink
              size="sm"
              to={`/resume-sessions${subjectScoped && subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`}
              variant="secondary"
            >
              {t('viewAll')}
            </ButtonLink>
          )}
        </div>

        <div className="grid gap-2">
          {visibleSessions.map((session) => {
            const remaining = formatRemainingTime(getRemainingSeconds(session));
            return (
              <div
                className="grid gap-3 rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={session.sessionId}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--sf-text)]">
                    {sessionTitle(session, t(getExamModeLabelKey(session.mode)))}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[var(--sf-text-muted)]">
                    {t(getExamModeLabelKey(session.mode))}
                    {session.subjectName ? ` · ${session.subjectName}` : ''}
                    {remaining ? ` · ${t('timeRemaining')}: ${remaining}` : ` · ${t('practiceResumeWindow')}`}
                  </p>
                </div>
                <Button onClick={() => resume(session)} size="sm" type="button">
                  {t('resumeSession')}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
