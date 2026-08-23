import {
  BarChart3,
  BookOpen,
  FileText,
  Home,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import {
  activeSubjectChangedEventName,
  readActiveSubject,
  writeActiveSubject,
  type ActiveSubjectChangedDetail,
} from '../../features/subjects/activeSubject';
import { useLanguage } from '../../i18n/LanguageContext';
import { AppLogo } from './AppLogo';

interface StudentNavigationProps {
  visible: boolean;
}

interface NavigationItem {
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  label: string;
  requiresSubject?: boolean;
  to: string;
}

function NavigationLink({
  compact,
  disabled,
  icon: Icon,
  label,
  selected,
  to,
}: {
  compact: boolean;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  selected: boolean;
  to: string;
}) {
  const commonClass = compact
    ? 'relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-bold leading-none transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--sf-focus)]'
    : 'flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-focus)]';
  const stateClass = selected
    ? compact
      ? 'text-[var(--sf-brand)]'
      : 'bg-[var(--sf-selected-soft)] text-[var(--sf-brand)]'
    : 'text-[var(--sf-text-muted)] hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-text)]';

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${commonClass} cursor-not-allowed opacity-45`}
        title={label}
      >
        <Icon aria-hidden="true" className={compact ? 'h-5.5 w-5.5' : 'h-5 w-5'} strokeWidth={2} />
        <span className={compact ? 'max-w-full truncate' : ''}>{label}</span>
      </span>
    );
  }

  return (
    <Link
      aria-current={selected ? 'page' : undefined}
      className={`${commonClass} ${stateClass}`}
      to={to}
    >
      <Icon aria-hidden="true" className={compact ? 'h-5.5 w-5.5' : 'h-5 w-5'} strokeWidth={2} />
      <span className={compact ? 'max-w-full truncate' : ''}>{label}</span>
    </Link>
  );
}

export function StudentNavigation({ visible }: StudentNavigationProps) {
  const { auth } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [activeSubjectId, setActiveSubjectId] = useState(() => readActiveSubject(auth?.userId));

  useEffect(() => {
    setActiveSubjectId(readActiveSubject(auth?.userId));
  }, [auth?.userId]);

  useEffect(() => {
    function handleActiveSubjectChanged(event: Event) {
      const detail = (event as CustomEvent<ActiveSubjectChangedDetail>).detail;
      if (detail.userId === auth?.userId) {
        setActiveSubjectId(detail.subjectId);
      }
    }

    window.addEventListener(activeSubjectChangedEventName, handleActiveSubjectChanged);
    return () => window.removeEventListener(activeSubjectChangedEventName, handleActiveSubjectChanged);
  }, [auth?.userId]);

  useEffect(() => {
    const subjectId = new URLSearchParams(location.search).get('subjectId');
    if (!auth?.userId || !subjectId) return;

    setActiveSubjectId(subjectId);
    writeActiveSubject(auth.userId, subjectId);
  }, [auth?.userId, location.search]);

  if (!visible) return null;

  const subjectQuery = activeSubjectId ? `?subjectId=${encodeURIComponent(activeSubjectId)}` : '';
  const items: NavigationItem[] = [
    {
      icon: Home,
      isActive: (pathname) => pathname === '/' || pathname === '/resume-sessions',
      label: t('homeShort'),
      to: '/',
    },
    {
      icon: FileText,
      isActive: (pathname) => pathname === '/papers',
      label: t('papersShort'),
      requiresSubject: true,
      to: `/papers${subjectQuery}`,
    },
    {
      icon: BookOpen,
      isActive: (pathname) => pathname === '/topics',
      label: t('unitsShort'),
      requiresSubject: true,
      to: `/topics${subjectQuery}`,
    },
    {
      icon: BarChart3,
      isActive: (pathname) => pathname === '/progress',
      label: t('progressShort'),
      requiresSubject: true,
      to: `/progress${subjectQuery}`,
    },
    {
      icon: UserRound,
      isActive: (pathname) => pathname === '/profile' || pathname === '/subscription',
      label: t('profileShort'),
      to: '/profile',
    },
  ];

  return (
    <>
      <nav
        aria-label={t('studentNavigation')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_var(--sf-text)] backdrop-blur-lg lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 px-1">
          {items.map((item) => (
            <NavigationLink
              compact
              disabled={Boolean(item.requiresSubject && !activeSubjectId)}
              icon={item.icon}
              key={item.label}
              label={item.label}
              selected={item.isActive(location.pathname)}
              to={item.to}
            />
          ))}
        </div>
      </nav>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-5 lg:flex">
        <AppLogo className="px-1" label={t('brandName')} />

        <nav aria-label={t('studentNavigation')} className="mt-8 grid gap-1">
          {items.map((item) => (
            <NavigationLink
              compact={false}
              disabled={Boolean(item.requiresSubject && !activeSubjectId)}
              icon={item.icon}
              key={item.label}
              label={item.label}
              selected={item.isActive(location.pathname)}
              to={item.to}
            />
          ))}
        </nav>

        {!activeSubjectId && (
          <p className="mt-auto rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-3 text-xs font-bold leading-5 text-[var(--sf-text-muted)]">
            {t('chooseSubjectFirst')}
          </p>
        )}
      </aside>
    </>
  );
}
