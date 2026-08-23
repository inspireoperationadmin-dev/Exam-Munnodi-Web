import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Clock3, FileQuestion, FileText, LockKeyhole } from 'lucide-react';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { EmptyState, LoadingPanel, PageShell } from '../../components/ui/Layout';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { getExamSessions } from '../../services/examService';
import { getPapers } from '../../services/paperService';
import type { PaperSummary, PaperType } from '../../types/academic';
import type { ExamSessionSummary, PaperSessionMode } from '../../types/exam';
import { getErrorMessage } from '../../utils/errors';
import { startStoredPaperSession } from '../exam/startStoredPaperSession';
import { filterResumableSessions } from '../resume/resumeSessionUtils';
import { PaperActionSheet } from './PaperActionSheet';

function newestSession(sessions: ExamSessionSummary[]) {
  return [...sessions].sort((left, right) => (
    new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime()
  ))[0] || null;
}

export function PapersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const requestedType: PaperType = searchParams.get('type') === 'ModelPaper' ? 'ModelPaper' : 'PastPaper';
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [resumableSessions, setResumableSessions] = useState<ExamSessionSummary[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<PaperSummary | null>(null);
  const [paperSheetOpen, setPaperSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [startingMode, setStartingMode] = useState<PaperSessionMode | 'fresh' | null>(null);

  useEffect(() => {
    if (!subjectId) return;

    let active = true;
    setLoading(true);
    setLoadError('');

    getStudentProfile()
      .then((profile) => Promise.all([
        getPapers({ subjectId, medium: profile.medium || undefined }),
        getExamSessions({ subjectId }).then(filterResumableSessions).catch(() => []),
      ]))
      .then(([paperItems, sessionItems]) => {
        if (!active) return;
        setPapers(paperItems.filter((paper) => paper.isPublic));
        setResumableSessions(sessionItems);
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error, t('papersLoadError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [subjectId, t]);

  const visiblePapers = useMemo(
    () => papers
      .filter((paper) => paper.type === requestedType)
      .sort((left, right) => (
        Number(left.isLocked) - Number(right.isLocked)
        || right.year - left.year
        || left.title.localeCompare(right.title)
      )),
    [papers, requestedType],
  );

  const selectedResumableSession = useMemo(() => {
    if (!selectedPaper) return null;
    return newestSession(resumableSessions.filter((session) => session.paperId === selectedPaper.id));
  }, [resumableSessions, selectedPaper]);

  if (!subjectId) return <Navigate replace to="/" />;

  function selectType(type: PaperType) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('type', type);
    setSearchParams(nextParams, { replace: true });
    setPaperSheetOpen(false);
    setActionError('');
  }

  function papersBackPath() {
    return `/papers?subjectId=${encodeURIComponent(subjectId!)}&type=${encodeURIComponent(requestedType)}`;
  }

  function continueSession(session: ExamSessionSummary) {
    const backPath = papersBackPath();
    navigate(`/exam?sessionId=${encodeURIComponent(session.sessionId)}&backPath=${encodeURIComponent(backPath)}`);
  }

  async function startSession(mode: PaperSessionMode, replaceSessionId?: string) {
    if (!selectedPaper || startingMode !== null) return;

    setActionError('');
    setStartingMode(replaceSessionId ? 'fresh' : mode);
    try {
      const backPath = papersBackPath();
      const started = await startStoredPaperSession({
        backPath,
        mode,
        paperId: selectedPaper.id,
        replaceSessionId,
        title: selectedPaper.title,
      });
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(backPath)}`);
    } catch (error) {
      setActionError(getErrorMessage(error, t('paperStartError')));
    } finally {
      setStartingMode(null);
    }
  }

  return (
    <PageShell maxWidth="xl">
      <nav aria-label={t('paperType')} className="grid grid-cols-2 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-1 shadow-[var(--sf-shadow-sm)]">
        {([
          ['PastPaper', t('pastPapers')],
          ['ModelPaper', t('modelPapers')],
        ] as const).map(([type, label]) => {
          const active = requestedType === type;
          return (
            <button
              aria-current={active ? 'page' : undefined}
              className={`min-h-11 rounded-lg px-3 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)] ${active ? 'bg-[var(--sf-primary)] text-[var(--sf-primary-text)] shadow-[var(--sf-shadow-sm)]' : 'text-[var(--sf-text-muted)] hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)]'}`}
              key={type}
              onClick={() => selectType(type)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </nav>

      {loadError && <AlertMessage>{loadError}</AlertMessage>}

      <section className="grid gap-3">
        {loading ? (
          <LoadingPanel label={t('loading')} />
        ) : visiblePapers.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visiblePapers.map((paper) => {
              const resumable = resumableSessions.some((session) => session.paperId === paper.id);
              return (
                <button
                  className={`group relative grid min-h-40 w-full grid-cols-[48px_minmax(0,1fr)_32px] items-start gap-3 overflow-hidden rounded-xl border bg-[var(--sf-surface)] p-4 text-left shadow-[var(--sf-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--sf-shadow-md)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)] ${paper.isLocked ? 'border-[var(--sf-border-strong)]' : 'border-[var(--sf-border)] hover:border-[var(--sf-border-strong)]'}`}
                  key={paper.id}
                  onClick={() => {
                    setActionError('');
                    setSelectedPaper(paper);
                    setPaperSheetOpen(true);
                  }}
                  type="button"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--sf-selected-soft)] text-[var(--sf-brand)]">
                    <FileText aria-hidden="true" className="h-6 w-6" />
                  </span>

                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase text-[var(--sf-brand)]">{paper.year}</span>
                      {resumable && <span className="rounded-md bg-[var(--sf-success-soft)] px-2 py-1 text-[10px] font-black uppercase text-[var(--sf-success-text)]">{t('continue')}</span>}
                    </span>
                    <span className="mt-2 line-clamp-2 block text-base font-black leading-6 text-[var(--sf-text)]">{paper.title}</span>
                    <span className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-[var(--sf-text-muted)]">
                      <span className="inline-flex items-center gap-1.5"><FileQuestion aria-hidden="true" className="h-4 w-4" />{paper.questionCount} {t('questions')}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-4 w-4" />{paper.timeLimit} {t('minutesShort')}</span>
                      {paper.sitting && <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4" />{paper.sitting}</span>}
                    </span>
                  </span>

                  <span className="grid h-8 w-8 place-items-center rounded-full text-[var(--sf-text-muted)] transition group-hover:bg-[var(--sf-surface-muted)] group-hover:text-[var(--sf-brand)]">
                    <ChevronRight aria-hidden="true" className="h-5 w-5" />
                  </span>

                  {paper.isLocked && (
                    <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[var(--sf-locked-overlay)] backdrop-blur-[2px]">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--sf-border-strong)] bg-[var(--sf-locked-badge)] px-4 py-2 text-sm font-black uppercase text-[var(--sf-text)] shadow-[var(--sf-shadow-md)]">
                        <LockKeyhole aria-hidden="true" className="h-5 w-5 text-[var(--sf-brand)]" />
                        {t('locked')}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState imageSrc="/assets/nothing.svg" title={t('noPapersTitle')} text={t('noPapersSubtitle')} />
        )}
      </section>

      <PaperActionSheet
        error={actionError}
        onClose={() => {
          if (startingMode === null) setPaperSheetOpen(false);
        }}
        onContinue={continueSession}
        onStart={(mode, replaceSessionId) => void startSession(mode, replaceSessionId)}
        open={paperSheetOpen}
        paper={selectedPaper}
        resumableSession={selectedResumableSession}
        startingMode={startingMode}
      />
    </PageShell>
  );
}
