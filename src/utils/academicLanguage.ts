import type { AppLanguage } from '../i18n/translations';
import type { AcademicStream, PaperMedium, Subject } from '../types/academic';

type LocalizedAcademicItem = Pick<AcademicStream, 'nameEnglish' | 'nameTamil' | 'nameSinhala'>
  | Pick<Subject, 'nameEnglish' | 'nameTamil' | 'nameSinhala'>;

export function mediumToLanguage(medium: PaperMedium): AppLanguage {
  if (medium === 'Tamil') return 'ta';
  if (medium === 'Sinhala') return 'si';
  return 'en';
}

export function getAcademicName(item: LocalizedAcademicItem, language: AppLanguage) {
  if (language === 'ta') {
    return item.nameTamil || item.nameEnglish;
  }

  if (language === 'si') {
    return item.nameSinhala || item.nameEnglish;
  }

  return item.nameEnglish;
}
