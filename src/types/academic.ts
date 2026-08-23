export type PaperMedium = 'English' | 'Tamil' | 'Sinhala';
export type PaperType = 'PastPaper' | 'ModelPaper';

export interface AcademicStream {
  id: string;
  nameEnglish: string;
  nameTamil?: string | null;
  nameSinhala?: string | null;
}

export interface Subject {
  id: string;
  nameEnglish: string;
  nameTamil?: string | null;
  nameSinhala?: string | null;
  topicCount: number;
}

export interface SubTopic {
  id: string;
  orderIndex: number;
  nameEnglish: string;
  nameTamil?: string | null;
  nameSinhala?: string | null;
}

export interface TopicWithSubTopics {
  id: string;
  orderIndex: number;
  subTopics: SubTopic[];
  nameEnglish: string;
  nameTamil?: string | null;
  nameSinhala?: string | null;
}

export interface StudentSubject {
  id: string;
  name: string;
  nameEnglish?: string | null;
  nameTamil?: string | null;
  nameSinhala?: string | null;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  streamName: string | null;
  medium: PaperMedium | null;
  examYear: number | null;
  isSetupComplete: boolean;
  subjects: StudentSubject[];
}

export interface SetupStudentProfileRequest {
  streamId: string;
  medium: PaperMedium;
  examYear: number;
  subjectIds: string[];
}

export interface PaperSummary {
  id: string;
  title: string;
  subjectName: string;
  type: PaperType | string;
  medium: PaperMedium | string;
  year: number;
  sitting: string | null;
  questionCount: number;
  isPublic: boolean;
  timeLimit: number;
  createdAt: string;
  isLocked: boolean;
  canPractice: boolean;
  canUseExamMode: boolean;
  lockReason: string | null;
  requiredPlan: string | null;
}

export interface ExamOption {
  id: string;
  label: string;
  optionText: string;
  optionImageUrl: string | null;
}

export interface ExamQuestion {
  id: string;
  orderIndex: number;
  questionText: string;
  questionImageUrl: string | null;
  marks: number;
  options: ExamOption[];
}
