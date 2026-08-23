import type { ExamSessionSummary } from '../../types/exam';
import { isPracticeMode } from '../../types/exam';

const practiceResumeWindowMs = 24 * 60 * 60 * 1000;

function parseTime(value: string | null | undefined) {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? null : time;
}

export function getRemainingSeconds(session: ExamSessionSummary) {
  const serverNow = parseTime(session.serverNow) ?? Date.now();
  const expiresAt = parseTime(session.expiresAt);
  if (expiresAt === null) return null;

  return Math.max(0, Math.floor((expiresAt - serverNow) / 1000));
}

export function isResumableSession(session: ExamSessionSummary) {
  if (session.status !== 'InProgress' || session.endTime) return false;

  const serverNow = parseTime(session.serverNow) ?? Date.now();

  if (session.expiresAt) {
    const expiresAt = parseTime(session.expiresAt);
    return expiresAt !== null && expiresAt > serverNow;
  }

  if (isPracticeMode(session.mode)) {
    const lastActivityAt = parseTime(session.lastActivityAt);
    return lastActivityAt !== null && (serverNow - lastActivityAt) <= practiceResumeWindowMs;
  }

  return false;
}

export function filterResumableSessions(sessions: ExamSessionSummary[]) {
  return sessions.filter(isResumableSession);
}

export function buildSessionBackPath(session: ExamSessionSummary, fallback = '/') {
  if (!session.subjectId) return fallback;

  const subjectQuery = `subjectId=${encodeURIComponent(session.subjectId)}`;
  if (session.mode === 'PaperPractice' || session.mode === 'PaperExam') return `/papers?${subjectQuery}`;
  if (session.mode === 'TopicPractice' || session.mode === 'TopicExam') return `/topics?${subjectQuery}`;
  return fallback;
}

export function formatRemainingTime(seconds: number | null) {
  if (seconds === null) return null;
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return `${minutes} min`;
}
