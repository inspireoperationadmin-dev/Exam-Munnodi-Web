export type ThemeButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';
export type ThemeButtonSize = 'sm' | 'md' | 'lg';
export type ThemeWidth = 'md' | 'lg' | 'xl';

export const theme = {
  colors: {
    page: 'bg-slate-50',
    surface: 'bg-white',
    surfaceMuted: 'bg-slate-50',
    text: 'text-slate-950',
    textMuted: 'text-slate-500',
    textSoft: 'text-slate-700',
    border: 'border-slate-200',
    borderStrong: 'border-slate-300',
    brand: 'bg-emerald-700',
    brandHover: 'hover:bg-emerald-800',
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
    eyebrow: 'text-xs font-black uppercase tracking-wide text-slate-500',
    brand: 'text-sm font-black uppercase tracking-wide text-slate-600',
    hero: 'text-4xl font-black leading-tight text-slate-950 sm:text-5xl',
    heading: 'text-2xl font-black leading-tight text-slate-950 sm:text-3xl',
    panelTitle: 'text-xl font-black text-slate-950',
    body: 'text-sm font-semibold leading-6 text-slate-500',
    label: 'text-sm font-semibold text-slate-700',
  },
  shell: {
    main: 'min-h-screen bg-slate-50',
    section: 'mx-auto grid w-full gap-4 px-4 py-5 sm:px-6',
    centered: 'mx-auto flex min-h-screen w-full flex-col px-4 py-5 sm:px-6',
    authContent: 'mx-auto grid min-h-[calc(100vh-76px)] max-w-5xl items-center px-4 pb-8 sm:px-6',
    lockedMain: 'h-screen overflow-hidden bg-slate-50',
    lockedSection: 'mx-auto flex h-full w-full flex-col gap-4 px-4 py-4 sm:px-6',
    header: 'flex items-center justify-between gap-3',
  },
  brand: {
    logo: 'inline-flex min-w-0 items-center gap-2',
    logoMark: 'h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-white object-cover shadow-sm',
    logoText: 'truncate text-sm font-black uppercase tracking-wide text-slate-700',
  },
  panel: {
    base: 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5',
    loading: 'grid min-h-48 place-items-center text-sm font-bold text-slate-500',
    muted: 'rounded-md border border-slate-200 bg-slate-50 p-3',
    inset: 'rounded-md bg-slate-50 p-3',
  },
  control: {
    input: 'h-10 rounded-md border border-slate-300 px-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100',
    select: 'h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100',
    iconButton: 'grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800',
  },
  card: {
    static: 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm',
    link: 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-100',
    dashed: 'rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm',
  },
  badge: {
    dark: 'rounded-md bg-emerald-700 px-2 py-1 text-xs font-black text-white',
    neutral: 'rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-700',
    count: 'grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-700 text-sm font-black text-white',
  },
  progress: {
    track: 'h-2 overflow-hidden rounded-full bg-slate-200',
    fill: 'h-full rounded-full bg-emerald-700',
  },
  button: {
    base: 'inline-flex items-center justify-center rounded-md border font-bold leading-5 transition disabled:cursor-not-allowed',
    tall: 'h-11 px-5',
    sizes: {
      sm: 'min-h-9 px-3 py-1.5 text-xs',
      md: 'min-h-10 px-3 py-2 text-sm',
      lg: 'min-h-11 px-5 py-2.5 text-sm',
    } satisfies Record<ThemeButtonSize, string>,
    variants: {
      primary: 'border-emerald-700 bg-emerald-700 text-white hover:border-emerald-800 hover:bg-emerald-800 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600',
      secondary: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400',
      danger: 'border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600',
      quiet: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
    } satisfies Record<ThemeButtonVariant, string>,
  },
  link: {
    text: 'font-bold text-slate-950 underline-offset-4 hover:underline',
    subtleButton: 'inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100',
  },
  alert: {
    base: 'rounded-md border border-l-4 px-3 py-2 text-sm font-semibold leading-6',
    error: 'border-red-200 bg-white text-slate-700',
    info: 'border-slate-200 bg-white text-slate-700',
  },
  avatar: {
    button: 'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-700 text-white shadow-sm transition hover:bg-emerald-800',
  },
} as const;
