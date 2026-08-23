export const activeSubjectChangedEventName = 'exam-munnodi:active-subject-changed';

export interface ActiveSubjectChangedDetail {
  subjectId: string;
  userId: string;
}

function activeSubjectStorageKey(userId: string) {
  return `exam_munnodi_active_subject_${userId}`;
}

export function readActiveSubject(userId?: string) {
  if (!userId) return '';

  try {
    return localStorage.getItem(activeSubjectStorageKey(userId)) || '';
  } catch {
    return '';
  }
}

export function writeActiveSubject(userId: string, subjectId: string) {
  try {
    localStorage.setItem(activeSubjectStorageKey(userId), subjectId);
  } catch {
    // The current page can still use its in-memory selection.
  }

  window.dispatchEvent(new CustomEvent<ActiveSubjectChangedDetail>(activeSubjectChangedEventName, {
    detail: { subjectId, userId },
  }));
}
