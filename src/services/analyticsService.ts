import { apiRequest } from './api';

export interface StudentProgressSubject {
  subjectId: string;
  subjectName: string;
  masteryPercentage: number;
  masteredQuestions: number;
  totalQuestions: number;
  lastStudiedAt: string | null;
}

export interface StudentProgressTopic {
  subjectId: string;
  topicId: string;
  topicName: string;
  masteryPercentage: number;
  masteredQuestions: number;
  totalQuestions: number;
  needsImprovementSubTopicCount: number;
  lastUpdated: string | null;
}

export interface StudentProgressFocusSubTopic {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subTopicId: string;
  subTopicName: string;
  reason: string;
}

export interface StudentProgressRecentExam {
  sessionId: string;
  subjectId: string | null;
  subjectName: string | null;
  mode: string;
  completedAt: string | null;
  score: number;
}

export interface StudentProgressSummary {
  subjects: StudentProgressSubject[];
  topics: StudentProgressTopic[];
  needsImprovement: StudentProgressFocusSubTopic[];
  recentExamScores: StudentProgressRecentExam[];
}

export function getStudentProgressSummary(subjectId?: string | null) {
  const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
  return apiRequest<StudentProgressSummary>(`/analytics/student-progress${query}`);
}
