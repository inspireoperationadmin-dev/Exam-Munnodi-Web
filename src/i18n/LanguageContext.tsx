import { createContext, useContext, useMemo, useState } from 'react';
import { languageNames, translations } from './translations';
import type { AppLanguage, TranslationKey } from './translations';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): AppLanguage {
  const saved = localStorage.getItem('student_language');
  return saved === 'ta' || saved === 'si' || saved === 'en' ? saved : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  const value = useMemo<LanguageContextValue>(() => {
    const setLanguage = (nextLanguage: AppLanguage) => {
      localStorage.setItem('student_language', nextLanguage);
      setLanguageState(nextLanguage);
    };

    return {
      language,
      setLanguage,
      t: (key) => translations[language][key] || translations.en[key],
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}

export { languageNames };
