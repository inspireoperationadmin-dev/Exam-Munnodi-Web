import { apiRequest } from './api';
import type {
  AcademicStream,
  SetupStudentProfileRequest,
  StudentProfile,
  Subject,
  TopicWithSubTopics,
} from '../types/academic';

export function getStreams() {
  return apiRequest<AcademicStream[]>('/academic/streams');
}

export function getSubjects(streamId?: string) {
  const query = streamId ? `?streamId=${encodeURIComponent(streamId)}` : '';
  return apiRequest<Subject[]>(`/academic/subjects${query}`);
}

export function getTopics(subjectId: string) {
  return apiRequest<TopicWithSubTopics[]>(`/academic/topics?subjectId=${encodeURIComponent(subjectId)}`);
}

export function getStudentProfile() {
  return apiRequest<StudentProfile>('/userprofiles/student/profile');
}

export function setupStudentProfile(payload: SetupStudentProfileRequest) {
  return apiRequest<void>('/userprofiles/student/profile/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
