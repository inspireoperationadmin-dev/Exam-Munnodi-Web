import { en } from './translations/en';
import { si } from './translations/si';
import { tm } from './translations/tm';
import type { TranslationKey } from './translations/en';

export type AppLanguage = 'en' | 'ta' | 'si';

export const languageNames: Record<AppLanguage, string> = {
  en: 'English',
  ta: 'தமிழ்',
  si: 'සිංහල',
};

export const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en,
  ta: tm,
  si,
};

export type { TranslationKey };
