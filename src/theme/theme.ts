export type ThemeButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';
export type ThemeButtonSize = 'sm' | 'md' | 'lg';
export type ThemeWidth = 'md' | 'lg' | 'xl';

export const theme = {
  colors: {
    page: 'bg-[#f7f8ff]',
    surface: 'bg-white',
    surfaceMuted: 'bg-indigo-50/50',
    text: 'text-slate-950',
    textMuted: 'text-slate-500',
    textSoft: 'text-slate-700',
    border: 'border-indigo-100',
    borderStrong: 'border-slate-300',
    brand: 'bg-indigo-600',
    brandHover: 'hover:bg-indigo-700',
    danger: 'bg-red-600',
    dangerHover: 'hover:bg-red-700',
    dangerBorder: 'border-red-200',
  },
  width: {
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
  } satisfies Record<ThemeWidth, string>,
  text: {
    eyebrow: 'text-xs font-black uppercase tracking-wide text-indigo-600',
    brand: 'text-sm font-black uppercase tracking-wide text-slate-700',
    hero: 'text-4xl font-black leading-tight text-slate-950 sm:text-5xl',
    heading: 'text-2xl font-black leading-tight text-slate-950 sm:text-3xl',
    panelTitle: 'text-xl font-black text-slate-950',
    body: 'text-sm font-semibold leading-6 text-slate-600',
    label: 'text-sm font-black text-slate-900',
  },
  shell: {
    main: 'min-h-screen bg-[#f7f8ff] text-slate-950',
    section: 'mx-auto grid w-full gap-4 px-4 py-5 sm:px-6',
    centered: 'mx-auto flex min-h-screen w-full flex-col px-4 py-5 sm:px-6',
    authContent: 'mx-auto grid w-full max-w-6xl gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.75fr)] lg:items-center',
    lockedMain: 'h-screen overflow-hidden bg-[#f7f8ff]',
    lockedSection: 'mx-auto flex h-full w-full flex-col gap-4 px-4 py-4 sm:px-6',
    header: 'flex items-center justify-between gap-3',
  },
  brand: {
    logo: 'inline-flex min-w-0 items-center gap-2',
    logoMark: 'h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-white object-cover shadow-sm',
    logoImage: 'h-12 w-auto max-w-56 shrink-0 object-contain',
    logoText: 'truncate text-sm font-black uppercase tracking-wide text-slate-700',
  },
  panel: {
    base: 'rounded-xl border border-indigo-100 bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-5',
    loading: 'grid min-h-48 place-items-center text-sm font-bold text-slate-500',
    muted: 'rounded-lg border border-indigo-100 bg-indigo-50/40 p-3',
    inset: 'rounded-lg bg-indigo-50/40 p-3',
  },
  control: {
    input: 'h-12 rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100',
    select: 'h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100',
    iconButton: 'grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700',
  },
  card: {
    static: 'rounded-xl border border-indigo-100 bg-white p-4 shadow-sm shadow-slate-200/70',
    link: 'rounded-xl border border-indigo-100 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:bg-indigo-50/40',
    dashed: 'rounded-xl border border-dashed border-indigo-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70',
  },
  badge: {
    dark: 'rounded-md bg-emerald-700 px-2 py-1 text-xs font-black text-white',
    neutral: 'rounded-md bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-700',
    count: 'grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-700 text-sm font-black text-white',
  },
  progress: {
    track: 'h-2 overflow-hidden rounded-full bg-slate-200',
    fill: 'h-full rounded-full bg-emerald-700',
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
      primary: 'border-emerald-700 bg-emerald-700 text-white shadow-sm shadow-emerald-900/10 hover:border-emerald-800 hover:bg-emerald-800 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600',
      secondary: 'border-slate-200 bg-white text-slate-800 hover:border-indigo-200 hover:bg-indigo-50 disabled:bg-slate-50 disabled:text-slate-400',
      danger: 'border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600',
      quiet: 'border-transparent bg-transparent text-slate-600 hover:bg-indigo-50 disabled:text-slate-400',
    } satisfies Record<ThemeButtonVariant, string>,
  },
  link: {
    text: 'font-bold text-indigo-600 underline-offset-4 hover:underline',
    subtleButton: 'inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50',
  },
  alert: {
    base: 'rounded-md border border-l-4 px-3 py-2 text-sm font-semibold leading-6',
    error: 'border-red-200 bg-white text-slate-700',
    info: 'border-slate-200 bg-white text-slate-700',
  },
  avatar: {
    button: 'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700',
  },
  feedback: {
    button: 'fixed bottom-4 right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-indigo-100 bg-white px-3.5 text-sm font-black text-slate-900 shadow-xl shadow-indigo-950/10 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:bottom-5 sm:right-5 sm:h-12 sm:px-4',
    icon: 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-950/10',
    label: 'hidden sm:inline',
  },
  auth: {
    header: 'mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6',
    hero: 'overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-white shadow-sm shadow-indigo-100/80',
    heroInner: 'grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center',
    card: 'mx-auto w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-5 shadow-xl shadow-indigo-100/80 sm:p-7',
    trustGrid: 'grid gap-3 text-center sm:grid-cols-3 lg:col-span-2',
    trustItem: 'rounded-xl border border-indigo-100 bg-white/90 p-4 shadow-sm shadow-slate-200/60',
    supportRow: 'flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left',
  },
} as const;
