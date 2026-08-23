import { examProgressStorageKey, examSessionStorageKey, startMockSession } from '../../services/examService';

interface StartStoredMockExamOptions {
  backPath: string;
  questionCount: number;
  subjectId: string;
  title: string;
}

export async function startStoredMockExam({
  backPath,
  questionCount,
  subjectId,
  title,
}: StartStoredMockExamOptions) {
  const started = await startMockSession(subjectId, questionCount);

  localStorage.removeItem(examProgressStorageKey(started.sessionId));
  localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
    session: started,
    clientStartedAt: Date.now(),
    paperTitle: title,
    backPath,
  }));

  return started;
}
