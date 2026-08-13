import { apiRequest } from './api';

export interface SubTopicPerformance {
  topicId: string;
  subTopicId: string;
  subTopicName: string;
  topicName: string;
  totalAttempts: number;
  correctCount: number;
  uniqueQuestionsAttempted: number;
  masteredQuestions: number;
  coveragePercentage: number;
  masteryPercentage: number;
  correctPercentage: number;
  healthPercentage: number;
  lastUpdated: string;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  totalQuestionsInTopic: number;
  uniqueQuestionsAttempted: number;
  masteredQuestions: number;
  totalAttempts: number;
  correctCount: number;
  coveragePercentage: number;
  masteryPercentage: number;
  accuracyPercentage: number;
  healthPercentage: number;
  lastUpdated: string;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalQuestionsInSubject: number;
  uniqueQuestionsAttempted: number;
  masteredQuestions: number;
  totalExams: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAttempted: number;
  overallCorrectPercentage: number;
  coveragePercentage: number;
  masteryPercentage: number;
  accuracyPercentage: number;
  readinessPercentage: number;
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

export function getTopicPerformance(subjectId: string) {
  return apiRequest<TopicPerformance[]>(`/analytics/subjects/${encodeURIComponent(subjectId)}/topics`);
}

export function getExamHistory(subjectId: string) {
  return apiRequest<ExamHistoryItem[]>(`/analytics/subjects/${encodeURIComponent(subjectId)}/history`);
}
