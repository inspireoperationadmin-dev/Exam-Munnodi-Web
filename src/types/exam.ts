import type { ExamQuestion } from './academic';

export type ExamMode = 'PaperPractice' | 'PaperExam' | 'MockExam' | 'TopicExam' | 'TopicPractice';
export type PaperSessionMode = Extract<ExamMode, 'PaperPractice' | 'PaperExam'>;
export type TopicSessionMode = Extract<ExamMode, 'TopicExam' | 'TopicPractice'>;

export function isPracticeMode(mode?: ExamMode | null) {
  return mode === 'PaperPractice' || mode === 'TopicPractice';
}

export function isTimedMode(mode?: ExamMode | null) {
  return mode === 'PaperExam' || mode === 'MockExam' || mode === 'TopicExam';
}

export interface StartedExamQuestion extends ExamQuestion {
  correctOptionId?: string | null;
  explanationText?: string | null;
}

export interface StartSessionResult {
  sessionId: string;
  startTime: string;
  serverNow: string;
  expiresAt: string | null;
  timeLimitMinutes: number | null;
  mode: ExamMode;
  questionCount: number;
  questions: StartedExamQuestion[];
}

export interface ExamSessionSummary {
  sessionId: string;
  paperId: string | null;
  subjectId: string | null;
  topicId: string | null;
  paperTitle: string | null;
  subjectName: string | null;
  startTime: string;
  lastActivityAt: string;
  serverNow: string;
  expiresAt: string | null;
  timeLimitMinutes: number | null;
  endTime: string | null;
  status: string;
  mode: ExamMode;
  percentage: number | null;
  obtainedMarks: number | null;
  totalMarks: number | null;
}

export interface ResumeAnswer {
  questionId: string;
  selectedOptionId: string | null;
  timeSpentSeconds: number;
  responseStatus: string;
}

export interface ResumeSessionResult {
  isResumable: boolean;
  status: string;
  title: string | null;
  session: StartSessionResult | null;
  responses: ResumeAnswer[];
  answeredCount: number;
  totalQuestions: number;
  remainingSeconds: number | null;
}

export interface SubmitAnswerRequest {
  questionId: string;
  selectedOptionId: string | null;
  timeSpentSeconds: number;
}

export interface EndSessionResult {
  sessionId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  isPassing: boolean;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenSeconds: number;
  mode: ExamMode;
  status: string;
}

export interface SessionDetail {
  sessionId: string;
  paperId: string | null;
  subjectId: string | null;
  paperTitle: string | null;
  startTime: string;
  serverNow: string;
  expiresAt: string | null;
  timeLimitMinutes: number | null;
  endTime: string | null;
  status: string;
  mode: ExamMode;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  isPassing: boolean;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenSeconds: number;
  affectsMastery: boolean;
  hasReviewData: boolean;
}

export interface ReviewOption {
  id: string;
  label: string;
  optionText: string;
  optionImageUrl: string | null;
  isCorrect: boolean;
}

export interface ReviewExplanationSection {
  title: string;
  content: string;
  orderIndex: number;
}

export interface ReviewExplanation {
  type: string;
  videoUrl: string | null;
  sections: ReviewExplanationSection[];
}

export interface SessionReviewItem {
  orderIndex: number;
  questionId: string;
  questionText: string;
  questionImageUrl: string | null;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
  marksAwarded: number;
  responseStatus: string;
  options: ReviewOption[];
  explanation: ReviewExplanation | null;
}
