import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ProfileAvatar } from '../../components/layout/ProfileAvatar';
import { AlertMessage } from '../../components/ui/AlertMessage';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, LoadingPanel, PageHeader, PageShell } from '../../components/ui/Layout';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { getStudentProfile } from '../../services/academicService';
import { getPapers } from '../../services/paperService';
import type { PaperSummary, PaperType, StudentProfile } from '../../types/academic';
import type { TranslationKey } from '../../i18n/translations';
import { theme } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errors';

function paperTypeLabelKey(type: string): TranslationKey {
  return type === 'ModelPaper' ? 'modelPaper' : 'pastPaper';
}

export function PapersPage() {
  const { t } = useLanguage();
  const { auth } = useAuth();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const requestedType: PaperType = searchParams.get('type') === 'ModelPaper' ? 'ModelPaper' : 'PastPaper';
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [papersLoading, setPapersLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setProfileLoading(true);

    getStudentProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('loadProfileError')));
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!subjectId || profileLoading) return;

    let active = true;
    setPapersLoading(true);
    setError('');

    getPapers({
      subjectId,
      type: requestedType,
      medium: profile?.medium || undefined,
    })
      .then((items) => {
        if (!active) return;
        setPapers(items.filter((paper) => paper.isPublic));
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, t('papersLoadError')));
      })
      .finally(() => {
        if (active) setPapersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profile?.medium, profileLoading, requestedType, subjectId, t]);

  const visiblePapers = useMemo(
    () => papers.filter((paper) => paper.type === requestedType),
    [papers, requestedType],
  );

  if (!subjectId) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell maxWidth="xl">
        <PageHeader>
          <Link
            className={theme.link.subtleButton}
            to={`/subject?subjectId=${encodeURIComponent(subjectId)}`}
          >
            {t('backToSubject')}
          </Link>
          <ProfileAvatar name={profile?.fullName} email={auth?.email} />
        </PageHeader>

        {error && <AlertMessage>{error}</AlertMessage>}

        <section className="grid gap-3">
          {profileLoading || papersLoading ? (
            <LoadingPanel label={t('loading')} />
          ) : visiblePapers.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visiblePapers.map((paper) => (
                <article key={paper.id} className={theme.card.static}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {t(paperTypeLabelKey(paper.type))}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-lg font-black leading-6 text-slate-950">
                        {paper.title}
                      </h3>
                    </div>
                    <span className={`shrink-0 ${theme.badge.neutral}`}>
                      {paper.year}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-bold text-slate-500">{t('medium')}</dt>
                      <dd className="mt-1 font-black text-slate-950">{paper.medium}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-slate-500">{t('questions')}</dt>
                      <dd className="mt-1 font-black text-slate-950">{paper.questionCount}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-slate-500">{t('time')}</dt>
                      <dd className="mt-1 font-black text-slate-950">{paper.timeLimit} {t('minutesShort')}</dd>
                    </div>
                    {paper.sitting && (
                      <div>
                        <dt className="font-bold text-slate-500">{t('sitting')}</dt>
                        <dd className="mt-1 font-black text-slate-950">{paper.sitting}</dd>
                      </div>
                    )}
                  </dl>

                  <ButtonLink
                    className="mt-4"
                    fullWidth
                    to={`/paper-preview?paperId=${encodeURIComponent(paper.id)}&subjectId=${encodeURIComponent(subjectId)}&type=${encodeURIComponent(requestedType)}`}
                    variant="primary"
                  >
                    {t('openPaper')}
                  </ButtonLink>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noPapersTitle')} text={t('noPapersSubtitle')} />
          )}
        </section>
    </PageShell>
  );
}
