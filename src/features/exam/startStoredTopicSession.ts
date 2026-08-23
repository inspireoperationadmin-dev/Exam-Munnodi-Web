import { examProgressStorageKey, examSessionStorageKey, startTopicSession } from '../../services/examService';
import type { TopicSessionMode } from '../../types/exam';

interface StartStoredTopicSessionOptions {
  backPath: string;
  limit: number;
  mode: TopicSessionMode;
  title: string;
  topicId: string;
}

export async function startStoredTopicSession({
  backPath,
  limit,
  mode,
  title,
  topicId,
}: StartStoredTopicSessionOptions) {
  const started = await startTopicSession(topicId, limit, mode);

  localStorage.removeItem(examProgressStorageKey(started.sessionId));
  localStorage.setItem(examSessionStorageKey(started.sessionId), JSON.stringify({
    session: started,
    clientStartedAt: Date.now(),
    paperTitle: title,
    backPath,
  }));

  return started;
}
