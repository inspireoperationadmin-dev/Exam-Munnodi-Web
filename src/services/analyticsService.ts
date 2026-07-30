import { apiRequest } from './api';

export interface SubTopicPerformance {
  subTopicId: string;
  subTopicName: string;
  topicName: string;
  totalAttempts: number;
  correctCount: number;
  correctPercentage: number;
  lastUpdated: string;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalExams: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAttempted: number;
  overallCorrectPercentage: number;
  studyStreakDays: number;
  lastStudiedAt: string | null;
}

export interface ExamHistoryItem {
  sessionId: string;
  paperTitle: string | null;
  date: string;
  score: number;
  obtainedMarks: number;
  totalMarks: number;
}

export function getSubjectPerformance() {
  return apiRequest<SubjectPerformance[]>('/analytics/subjects');
}

export function getSubTopicPerformance(subjectId: string) {
  return apiRequest<SubTopicPerformance[]>(`/analytics/subjects/${encodeURIComponent(subjectId)}/subtopics`);
}

export function getExamHistory(subjectId: string) {
  return apiRequest<ExamHistoryItem[]>(`/analytics/subjects/${encodeURIComponent(subjectId)}/history`);
}
