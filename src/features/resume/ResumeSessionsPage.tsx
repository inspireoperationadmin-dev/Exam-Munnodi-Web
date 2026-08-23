import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { EmptyState, Eyebrow, PageHeader, PageShell, Panel } from '../../components/ui/Layout';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getExamSessions } from '../../services/examService';
import type { ExamSessionSummary } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getExamModeLabelKey } from '../../utils/examMode';
import { getErrorMessage } from '../../utils/errors';
import { buildSessionBackPath, filterResumableSessions, formatRemainingTime, getRemainingSeconds } from './resumeSessionUtils';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function ResumeSessionsPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId') || undefined;
  const [sessions, setSessions] = useState<ExamSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getExamSessions({ subjectId })
      .then((rows) => {
        if (active) setSessions(filterResumableSessions(rows));
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('resumeSessionsLoadError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [subjectId, t]);

  if (subjectId === '') {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell>
      <PageHeader>
        <Link className={theme.link.subtleButton} to="/">
          {t('backToHome')}
        </Link>
        <ProfileAvatar email={auth?.email} />
      </PageHeader>

      <Panel>
        <Eyebrow>{t('pausedSessions')}</Eyebrow>
        <h1 className="mt-1 text-2xl font-black text-[var(--sf-text)] sm:text-3xl">{t('resumeSessionsTitle')}</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--sf-text-muted)]">
          {t('resumeSessionsSubtitle')}
        </p>
      </Panel>

      {error && <AlertMessage>{error}</AlertMessage>}

      {loading ? (
        <Panel className="text-sm font-bold text-[var(--sf-text-muted)]">{t('loading')}</Panel>
      ) : sessions.length ? (
        <section className="grid gap-3">
          {sessions.map((session) => {
            const title = session.paperTitle || session.subjectName || t(getExamModeLabelKey(session.mode));
            const remaining = formatRemainingTime(getRemainingSeconds(session));
            const backPath = buildSessionBackPath(session, '/');

            return (
              <Panel key={session.sessionId}>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-[var(--sf-brand)]">
                      {t(getExamModeLabelKey(session.mode))}
                    </p>
                    <h2 className="mt-1 break-words text-xl font-black text-[var(--sf-text)]">{title}</h2>
                    <p className="mt-1 text-sm font-bold text-[var(--sf-text-muted)]">
                      {session.subjectName || t('subject')} · {t('started')}: {formatDate(session.startTime)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[var(--sf-text-muted)]">
                      {remaining ? `${t('timeRemaining')}: ${remaining}` : t('practiceResumeWindow')}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      navigate(`/exam?sessionId=${encodeURIComponent(session.sessionId)}&backPath=${encodeURIComponent(backPath)}`);
                    }}
                    size="sm"
                    type="button"
                  >
                    {t('resumeSession')}
                  </Button>
                </div>
              </Panel>
            );
          })}
        </section>
      ) : (
        <EmptyState title={t('noPausedSessions')} text={t('noPausedSessionsText')} />
      )}
    </PageShell>
  );
}
