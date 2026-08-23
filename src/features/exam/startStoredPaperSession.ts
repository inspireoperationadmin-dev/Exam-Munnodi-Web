import { examProgressStorageKey, examSessionStorageKey, startPaperSession } from '../../services/examService';
import type { PaperSessionMode } from '../../types/exam';

interface StartStoredPaperSessionOptions {
  backPath: string;
  mode: PaperSessionMode;
  paperId: string;
  replaceSessionId?: string;
  title: string;
}

export async function startStoredPaperSession({
  backPath,
  mode,
  paperId,
  replaceSessionId,
  title,
}: StartStoredPaperSessionOptions) {
  const started = await startPaperSession(paperId, mode, replaceSessionId);

  localStorage.removeItem(examProgressStorageKey(started.sessionId));
  localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
    session: started,
    clientStartedAt: Date.now(),
    paperTitle: title,
    backPath,
  }));

  return started;
}
