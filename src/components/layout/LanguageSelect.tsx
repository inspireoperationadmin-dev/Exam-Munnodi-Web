import { languageNames, useLanguage } from '../../i18n/LanguageContext';
import type { AppLanguage } from '../../i18n/translations';
import { theme } from '../../theme/theme';

export function LanguageSelect() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      className={theme.control.select}
      value={language}
      onChange={(event) => setLanguage(event.target.value as AppLanguage)}
      aria-label="Language"
    >
      {(Object.keys(languageNames) as AppLanguage[]).map((code) => (
        <option key={code} value={code}>{languageNames[code]}</option>
      ))}
    </select>
  );
}
