import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { MathText } from '../../components/ui/MathText';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { examProgressStorageKey, examSessionStorageKey, startPaperSession } from '../../services/examService';
import { getPaperDetail, getPaperPreviewQuestions } from '../../services/paperService';
import type { ExamQuestion, PaperDetail, StudentProfile } from '../../types/academic';
import type { ExamMode } from '../../types/exam';
import { theme } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errors';

export function PaperPreviewPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get('paperId');
  const subjectId = searchParams.get('subjectId');
  const type = searchParams.get('type') || 'PastPaper';
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingMode, setStartingMode] = useState<ExamMode | null>(null);

  useEffect(() => {
    if (!paperId) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([getPaperDetail(paperId), getPaperPreviewQuestions(paperId), getStudentProfile()])
      .then(([paperDetail, previewQuestions, studentProfile]) => {
        if (!active) return;
        setPaper(paperDetail);
        setQuestions(previewQuestions);
        setProfile(studentProfile);
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('papersLoadError')));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paperId, t]);

  if (!paperId) {
    return <Navigate to="/" replace />;
  }

  const backPath = subjectId
    ? `/papers?subjectId=${encodeURIComponent(subjectId)}&type=${encodeURIComponent(type)}`
    : '/';

  async function startSession(mode: Extract<ExamMode, 'Practice' | 'FixedExam'>) {
    if (!paperId || !questions.length || startingMode !== null) return;

    setError('');
    setStartingMode(mode);

    try {
      const previewBackPath = `/paper-preview?paperId=${encodeURIComponent(paperId)}${subjectId ? `&subjectId=${encodeURIComponent(subjectId)}` : ''}&type=${encodeURIComponent(type)}`;
      const started = await startPaperSession(paperId, mode);
      localStorage.removeItem(examProgressStorageKey(started.sessionId));
      localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
        session: started,
        clientStartedAt: Date.now(),
        paperTitle: paper?.title || '',
        backPath: previewBackPath,
      }));
      navigate(`/exam?sessionId=${encodeURIComponent(started.sessionId)}&backPath=${encodeURIComponent(previewBackPath)}`);
    } catch (startError) {
      setError(getErrorMessage(startError, 'Could not start this paper.'));
    } finally {
      setStartingMode(null);
    }
  }

  return (
    <main className={theme.shell.lockedMain}>
      <section className={`${theme.shell.lockedSection} ${theme.width.xl}`}>
        <header className="flex items-center justify-between gap-3">
          <Link
            className={theme.link.subtleButton}
            to={backPath}
          >
            {t('backToPapers')}
          </Link>
          <ProfileAvatar name={profile?.fullName} email={auth?.email} />
        </header>

        {error && <AlertMessage>{error}</AlertMessage>}

        <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1">
          <div className="min-h-0 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="grid min-h-full place-items-center p-6 text-sm font-black text-slate-500">
                {t('loading')}
              </div>
            ) : questions.length ? (
              <div className="grid gap-4 p-4 sm:p-5">
                <div className="border-b border-slate-200 pb-4">
                  <p className={theme.text.eyebrow}>{t('paperPreview')}</p>
                  <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                    {paper?.title || t('paperPreview')}
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{t('paperPreviewSubtitle')}</p>
                </div>

                {questions.map((question, questionIndex) => (
                  <article key={question.id} className="min-w-0 overflow-hidden rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className={theme.badge.count}>
                        {questionIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <MathText
                          className="block break-words text-base font-bold leading-7 text-slate-950 [overflow-wrap:anywhere]"
                          text={question.questionText}
                        />
                        {question.questionImageUrl && (
                          <img
                            alt=""
                            className="mt-3 max-h-80 w-full rounded-md border border-slate-200 object-contain"
                            src={question.questionImageUrl}
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {question.options.map((option) => (
                        <div
                          className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-3"
                          key={option.id}
                        >
                          <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3">
                            <span className="font-black text-slate-700">{option.label}</span>
                            <div className="min-w-0">
                            <MathText
                              className="block break-words text-sm font-semibold leading-6 text-slate-800 [overflow-wrap:anywhere]"
                              text={option.optionText}
                            />
                            {option.optionImageUrl && (
                              <img
                                alt=""
                                className="mt-2 max-h-56 w-full rounded-md border border-slate-200 object-contain"
                                src={option.optionImageUrl}
                              />
                            )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-full place-items-center p-6 text-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-950">{t('noPreviewQuestionsTitle')}</h1>
                  <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                    {t('noPreviewQuestionsText')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className={`order-first ${theme.card.static} lg:order-none lg:self-start`}>
            <h1 className="text-lg font-black leading-tight text-slate-950 sm:text-2xl">
              {paper?.title || t('paperPreview')}
            </h1>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-bold text-slate-500">{t('medium')}</dt>
                <dd className="mt-1 font-black text-slate-950">{paper?.medium || '-'}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">{t('year')}</dt>
                <dd className="mt-1 font-black text-slate-950">{paper?.year || '-'}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">{t('questions')}</dt>
                <dd className="mt-1 font-black text-slate-950">{paper?.questionCount ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">{t('time')}</dt>
                <dd className="mt-1 font-black text-slate-950">
                  {paper?.timeLimit ? `${paper.timeLimit} ${t('minutesShort')}` : '-'}
                </dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-2">
              <Button
                className={theme.button.tall}
                fullWidth
                disabled={loading || !questions.length || startingMode !== null}
                onClick={() => void startSession('Practice')}
                type="button"
              >
                {startingMode === 'Practice' ? t('loading') : t('startPractice')}
              </Button>
              <Button
                className={theme.button.tall}
                fullWidth
                disabled={loading || !questions.length || startingMode !== null}
                onClick={() => void startSession('FixedExam')}
                type="button"
                variant="secondary"
              >
                {startingMode === 'FixedExam' ? t('loading') : t('startPaperExam')}
              </Button>
            </div>
          </aside>
        </section>
      </section>
      <LoadingOverlay label={t('startingExam')} open={startingMode !== null} />
    </main>
  );
}
