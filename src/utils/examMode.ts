import type { ExamMode } from '../types/exam';
import type { TranslationKey } from '../i18n/translations/en';

export function getExamModeLabelKey(mode?: ExamMode | null): TranslationKey {
  if (mode === 'MockExam') return 'mockExam';
  if (mode === 'TopicExam') return 'topicExam';
  if (mode === 'PaperExam') return 'paperExam';
  return 'practice';
}
