import type { AcademicContentLanguage } from '../i18n/translations';
import type { AcademicStream, PaperMedium, StudentSubject, Subject } from '../types/academic';

type LocalizedAcademicItem = Pick<AcademicStream, 'nameEnglish' | 'nameTamil' | 'nameSinhala'>
  | Pick<Subject, 'nameEnglish' | 'nameTamil' | 'nameSinhala'>
  | Pick<StudentSubject, 'name' | 'nameEnglish' | 'nameTamil' | 'nameSinhala'>;

export function mediumToLanguage(medium: PaperMedium): AcademicContentLanguage {
  if (medium === 'Tamil') return 'ta';
  if (medium === 'Sinhala') return 'si';
  return 'en';
}

export function getAcademicName(item: LocalizedAcademicItem, language: AcademicContentLanguage) {
  const fallbackName = ('name' in item ? item.name : item.nameEnglish) || '';
  const englishName = item.nameEnglish || fallbackName;

  if (language === 'ta') {
    return item.nameTamil || englishName;
  }

  if (language === 'si') {
    return item.nameSinhala || englishName;
  }

  return englishName;
}
