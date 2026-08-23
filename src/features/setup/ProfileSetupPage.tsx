import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLogo } from '../../components/layout/AppLogo';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { Panel } from '../../components/ui/Layout';
import { WhatsAppLink } from '../../components/ui/WhatsAppLink';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getSubjects, getStreams, setupStudentProfile } from '../../services/academicService';
import type { AcademicStream, PaperMedium, Subject } from '../../types/academic';
import { theme } from '../../theme/theme';
import { getAcademicName, mediumToLanguage } from '../../utils/academicLanguage';
import { getErrorMessage } from '../../utils/errors';

const mediums: PaperMedium[] = ['Tamil', 'English', 'Sinhala'];
const currentYear = new Date().getFullYear();
const examYears = Array.from({ length: 10 }, (_, index) => Math.min(2035, currentYear + index));

export function ProfileSetupPage() {
  const { t } = useLanguage();
  const { markProfileSetup } = useAuth();
  const navigate = useNavigate();
  const [streams, setStreams] = useState<AcademicStream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [medium, setMedium] = useState<PaperMedium>('Tamil');
  const [streamId, setStreamId] = useState('');
  const [examYear, setExamYear] = useState(currentYear);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const academicLanguage = useMemo(() => mediumToLanguage(medium), [medium]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getStreams()
      .then((items) => {
        if (!active) return;
        setStreams(items);
        setStreamId((current) => current || items[0]?.id || '');
      })
      .catch((loadError) => setError(getErrorMessage(loadError, t('setupError'))))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    let active = true;
    setSubjectIds([]);

    if (!streamId) {
      setSubjects([]);
      return () => {
        active = false;
      };
    }

    setSubjectsLoading(true);
    getSubjects(streamId)
      .then((items) => {
        if (active) setSubjects(items);
      })
      .catch((loadError) => setError(getErrorMessage(loadError, t('setupError'))))
      .finally(() => {
        if (active) setSubjectsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [streamId, t]);

  function toggleSubject(subjectId: string) {
    setSubjectIds((current) => {
      if (current.includes(subjectId)) {
        return current.filter((id) => id !== subjectId);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, subjectId];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!streamId || subjectIds.length !== 3) {
      setError(t('selectSubjects'));
      return;
    }

    setSubmitting(true);

    try {
      await setupStudentProfile({
        streamId,
        medium,
        examYear,
        subjectIds,
      });
      markProfileSetup();
      navigate('/', { replace: true });
    } catch (setupError) {
      setError(getErrorMessage(setupError, t('setupError')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={theme.shell.main}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <AppLogo label={t('brandName')} />
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <Panel>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[var(--sf-text)]">{t('setupTitle')}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{t('setupSubtitle')}</p>
          </div>

          {error && <div className="mb-4"><AlertMessage>{error}</AlertMessage></div>}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-semibold text-[var(--sf-text-soft)]">
              {t('mediumLanguage')}
              <select
                className={theme.control.select}
                value={medium}
                onChange={(event) => setMedium(event.target.value as PaperMedium)}
              >
                {mediums.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[var(--sf-text-soft)]">
              {t('stream')}
              <select
                className={theme.control.select}
                value={streamId}
                onChange={(event) => setStreamId(event.target.value)}
                disabled={loading}
              >
                <option value="">{loading ? t('loading') : t('selectStream')}</option>
                {streams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {getAcademicName(stream, academicLanguage)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[var(--sf-text-soft)]">
              {t('examYear')}
              <select
                className={theme.control.select}
                value={examYear}
                onChange={(event) => setExamYear(Number(event.target.value))}
              >
                {examYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--sf-text)]">{t('subjects')}</h2>
                <p className="text-sm font-medium text-[var(--sf-text-muted)]">{t('setupHint')}</p>
              </div>
              <span className="rounded-md bg-[var(--sf-surface-muted)] px-2.5 py-1 text-sm font-bold text-[var(--sf-text-soft)]">
                {subjectIds.length}/3
              </span>
            </div>

            {subjectsLoading ? (
              <div className={`${theme.card.static} text-sm font-semibold text-[var(--sf-text-muted)]`}>
                {t('loading')}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => {
                  const selected = subjectIds.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      className={`rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--sf-focus)] ${
                        selected
                          ? 'border-[var(--sf-primary)] bg-[var(--sf-success-soft)] text-[var(--sf-text)]'
                          : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-soft)] hover:border-[var(--sf-border-strong)] hover:bg-[var(--sf-surface-muted)]'
                      }`}
                      onClick={() => toggleSubject(subject.id)}
                      aria-pressed={selected}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-bold">{getAcademicName(subject, academicLanguage)}</span>
                        {selected && (
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--sf-primary)] text-xs font-black text-[var(--sf-primary-text)]">
                            ✓
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm font-medium opacity-75">{subject.topicCount} topics</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <WhatsAppLink
              label={t('needHelp')}
              message="Hi Exam Munnodi, I need help setting up my student profile."
            />
            <Button
              disabled={submitting || loading || subjectsLoading || subjectIds.length !== 3}
            >
              {submitting ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
        </Panel>
      </section>
      <LoadingOverlay label={t('savingProfile')} open={submitting} />
    </main>
  );
}
