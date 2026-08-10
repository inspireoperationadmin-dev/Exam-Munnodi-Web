import { createContext, useContext, useMemo } from 'react';
import { en } from './translations/en';
import type { TranslationKey } from './translations/en';

interface LanguageContextValue {
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<LanguageContextValue>(() => {
    return {
      t: (key) => en[key],
    };
  }, []);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
