export type ThemeButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';
export type ThemeButtonSize = 'sm' | 'md' | 'lg';
export type ThemeWidth = 'md' | 'lg' | 'xl';

export const theme = {
  colors: {
    page: 'bg-[var(--sf-page)]',
    surface: 'bg-[var(--sf-surface)]',
    surfaceMuted: 'bg-[var(--sf-surface-muted)]',
    text: 'text-[var(--sf-text)]',
    textMuted: 'text-[var(--sf-text-muted)]',
    textSoft: 'text-[var(--sf-text-soft)]',
    border: 'border-[var(--sf-border)]',
    borderStrong: 'border-[var(--sf-border-strong)]',
    brand: 'bg-[var(--sf-brand)]',
    brandHover: 'hover:bg-[var(--sf-brand-hover)]',
    danger: 'bg-[var(--sf-danger)]',
    dangerHover: 'hover:bg-[var(--sf-danger-hover)]',
    dangerBorder: 'border-[var(--sf-danger-border)]',
  },
  width: {
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
  } satisfies Record<ThemeWidth, string>,
  text: {
    eyebrow: 'text-xs font-black uppercase tracking-wide text-[var(--sf-brand)]',
    brand: 'text-sm font-black uppercase tracking-wide text-[var(--sf-text-soft)]',
    hero: 'text-4xl font-black leading-tight text-[var(--sf-text)] sm:text-5xl',
    heading: 'text-2xl font-black leading-tight text-[var(--sf-text)] sm:text-3xl',
    panelTitle: 'text-xl font-black text-[var(--sf-text)]',
    body: 'text-sm font-semibold leading-6 text-[var(--sf-text-muted)]',
    label: 'text-sm font-black text-[var(--sf-text)]',
  },
  shell: {
    main: 'min-h-screen min-h-dvh bg-[var(--sf-page)] text-[var(--sf-text)] transition-colors duration-200',
    section: 'mx-auto grid w-full gap-4 px-4 py-5 sm:px-6',
    centered: 'mx-auto flex min-h-screen w-full flex-col px-4 py-5 sm:px-6',
    authContent: 'mx-auto grid w-full max-w-6xl gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.75fr)] lg:items-center',
    lockedMain: 'h-screen overflow-hidden bg-[var(--sf-page)] text-[var(--sf-text)] transition-colors duration-200',
    lockedSection: 'mx-auto flex h-full w-full flex-col gap-4 px-4 py-4 sm:px-6',
    header: 'flex items-center justify-between gap-3',
  },
  brand: {
    logo: 'inline-flex min-w-0 items-center gap-2',
    logoMark: 'h-10 w-10 shrink-0 rounded-md border border-[var(--sf-border)] bg-[var(--sf-surface)] object-cover shadow-[var(--sf-shadow-sm)]',
    logoImage: 'h-12 w-auto max-w-56 shrink-0 object-contain',
    logoText: 'truncate text-sm font-black uppercase tracking-wide text-[var(--sf-text-soft)]',
  },
  panel: {
    base: 'rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] transition-colors duration-200 sm:p-5',
    loading: 'grid min-h-48 place-items-center text-sm font-bold text-[var(--sf-text-muted)]',
    muted: 'rounded-lg border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] p-3',
    inset: 'rounded-lg bg-[var(--sf-surface-muted)] p-3',
  },
  control: {
    input: 'h-12 rounded-lg border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-4 text-[var(--sf-text)] outline-none transition placeholder:text-[var(--sf-text-muted)] focus:border-[var(--sf-brand)] focus:ring-4 focus:ring-[var(--sf-focus)]',
    select: 'h-11 rounded-lg border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-3 text-sm font-bold text-[var(--sf-text)] outline-none transition focus:border-[var(--sf-brand)] focus:ring-4 focus:ring-[var(--sf-focus)]',
    iconButton: 'grid h-8 w-8 place-items-center rounded-md text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface-muted)] hover:text-[var(--sf-brand)]',
  },
  card: {
    static: 'rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)]',
    link: 'rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow-sm)] transition hover:bg-[var(--sf-surface-muted)]',
    dashed: 'rounded-xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface)] p-8 text-center shadow-[var(--sf-shadow-sm)]',
  },
  badge: {
    dark: 'rounded-md bg-[var(--sf-primary)] px-2 py-1 text-xs font-black text-[var(--sf-primary-text)]',
    neutral: 'rounded-md bg-[var(--sf-surface-muted)] px-2 py-1 text-xs font-black text-[var(--sf-brand)]',
    count: 'grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--sf-primary)] text-sm font-black text-[var(--sf-primary-text)]',
  },
  progress: {
    track: 'h-2 overflow-hidden rounded-full bg-[var(--sf-progress-track)]',
    fill: 'h-full rounded-full bg-[var(--sf-primary)]',
  },
  button: {
    base: 'inline-flex items-center justify-center rounded-lg border font-bold leading-5 transition disabled:cursor-not-allowed',
    tall: 'h-11 px-5',
    sizes: {
      sm: 'min-h-9 px-3 py-1.5 text-xs',
      md: 'min-h-10 px-3 py-2 text-sm',
      lg: 'min-h-11 px-5 py-2.5 text-sm',
    } satisfies Record<ThemeButtonSize, string>,
    variants: {
      primary: 'border-[var(--sf-primary)] bg-[var(--sf-primary)] text-[var(--sf-primary-text)] shadow-[var(--sf-shadow-sm)] hover:border-[var(--sf-primary-hover)] hover:bg-[var(--sf-primary-hover)] disabled:border-[var(--sf-border-strong)] disabled:bg-[var(--sf-border-strong)] disabled:text-[var(--sf-text-muted)]',
      secondary: 'border-[var(--sf-border-strong)] bg-[var(--sf-surface)] text-[var(--sf-text)] hover:border-[var(--sf-border)] hover:bg-[var(--sf-surface-muted)] disabled:bg-[var(--sf-surface-muted)] disabled:text-[var(--sf-text-muted)]',
      danger: 'border-[var(--sf-danger)] bg-[var(--sf-danger)] text-[var(--sf-danger-on)] hover:bg-[var(--sf-danger-hover)] disabled:border-[var(--sf-border-strong)] disabled:bg-[var(--sf-border-strong)] disabled:text-[var(--sf-text-muted)]',
      quiet: 'border-transparent bg-transparent text-[var(--sf-text-muted)] hover:bg-[var(--sf-surface-muted)] disabled:text-[var(--sf-text-muted)]',
    } satisfies Record<ThemeButtonVariant, string>,
  },
  link: {
    text: 'font-bold text-[var(--sf-brand)] underline-offset-4 hover:underline',
    subtleButton: 'inline-flex h-11 items-center rounded-lg border border-[var(--sf-border-strong)] bg-[var(--sf-surface)] px-3 text-sm font-bold text-[var(--sf-text)] shadow-[var(--sf-shadow-sm)] transition hover:border-[var(--sf-border)] hover:bg-[var(--sf-surface-muted)]',
  },
  alert: {
    base: 'rounded-md border border-l-4 px-3 py-2 text-sm font-semibold leading-6',
    error: 'border-[var(--sf-danger-border)] bg-[var(--sf-surface)] text-[var(--sf-text-soft)]',
    info: 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-soft)]',
  },
  avatar: {
    button: 'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--sf-brand)] text-[var(--sf-brand-text)] shadow-[var(--sf-shadow-sm)] transition hover:bg-[var(--sf-brand-hover)]',
  },
  feedback: {
    button: 'fixed right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3.5 text-sm font-black text-[var(--sf-text)] shadow-[var(--sf-shadow-md)] transition hover:-translate-y-0.5 hover:bg-[var(--sf-surface-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-focus)] sm:right-5 sm:h-12 sm:px-4',
    positionDefault: 'bottom-4 sm:bottom-5',
    positionWithNavigation: 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-5',
    icon: 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--sf-brand)] text-[var(--sf-brand-text)] shadow-[var(--sf-shadow-sm)]',
    label: 'hidden sm:inline',
  },
  auth: {
    header: 'mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6',
    hero: 'overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow-md)]',
    heroInner: 'grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center',
    card: 'mx-auto w-full max-w-md rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[var(--sf-shadow-md)] sm:p-7',
    trustGrid: 'grid gap-3 text-center sm:grid-cols-3 lg:col-span-2',
    trustItem: 'rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-raised)] p-4 shadow-[var(--sf-shadow-sm)]',
    supportRow: 'flex items-center justify-between gap-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-muted)] px-4 py-3 text-left',
  },
} as const;
