import { apiRequest } from './api';
import type {
  EndSessionResult,
  ExamMode,
  ActiveSession,
  ResumeSessionResult,
  SessionDetail,
  SessionReviewItem,
  StartSessionResult,
  SubmitAnswerRequest,
} from '../types/exam';

export function startPaperSession(paperId: string, mode: Extract<ExamMode, 'Practice' | 'FixedExam'>) {
  return apiRequest<StartSessionResult>('/examination/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ paperId, mode }),
  });
}

export function startTopicSession(topicId: string, limit: number, mode: Extract<ExamMode, 'Practice' | 'FixedExam'>) {
  return apiRequest<StartSessionResult>('/examination/sessions/start-topic', {
    method: 'POST',
    body: JSON.stringify({ topicId, limit, mode }),
  });
}

export function startMockSession(subjectId: string, questionCount: number) {
  return apiRequest<StartSessionResult>('/examination/sessions/generate', {
    method: 'POST',
    body: JSON.stringify({ subjectId, questionCount }),
  });
}

export function submitExamAnswer(sessionId: string, answer: SubmitAnswerRequest) {
  return apiRequest<void>(`/examination/sessions/${encodeURIComponent(sessionId)}/answer`, {
    method: 'POST',
    body: JSON.stringify(answer),
  });
}

export function endExamSession(sessionId: string, answers: SubmitAnswerRequest[]) {
  return apiRequest<EndSessionResult>(`/examination/sessions/${encodeURIComponent(sessionId)}/end`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export function abandonExamSession(sessionId: string) {
  return apiRequest<void>(`/examination/sessions/${encodeURIComponent(sessionId)}/abandon`, {
    method: 'POST',
  });
}

export function getSessionDetail(sessionId: string) {
  return apiRequest<SessionDetail>(`/examination/sessions/${encodeURIComponent(sessionId)}`);
}

export function getSessionReview(sessionId: string) {
  return apiRequest<SessionReviewItem[]>(`/examination/sessions/${encodeURIComponent(sessionId)}/review`);
}

export function getActiveSession(subjectId?: string) {
  const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
  return apiRequest<ActiveSession | null>(`/examination/sessions/active${query}`);
}

export function getSessionResume(sessionId: string) {
  return apiRequest<ResumeSessionResult>(`/examination/sessions/${encodeURIComponent(sessionId)}/resume`);
}

export function examSessionStorageKey(sessionId: string) {
  return `scholarflow_exam_session_${sessionId}`;
}

export function examProgressStorageKey(sessionId: string) {
  return `scholarflow_exam_progress_${sessionId}`;
}
