import { apiRequest } from './api';
import type { ExamQuestion, PaperDetail, PaperMedium, PaperSummary, PaperType } from '../types/academic';

interface GetPapersParams {
  subjectId?: string;
  type?: PaperType;
  medium?: PaperMedium;
  year?: number;
}

export function getPapers(params: GetPapersParams = {}) {
  const search = new URLSearchParams();

  if (params.subjectId) search.set('subjectId', params.subjectId);
  if (params.type) search.set('type', params.type);
  if (params.medium) search.set('medium', params.medium);
  if (params.year) search.set('year', String(params.year));

  const query = search.toString();
  return apiRequest<PaperSummary[]>(`/academic/papers${query ? `?${query}` : ''}`);
}

export function getPaperDetail(paperId: string) {
  return apiRequest<PaperDetail>(`/academic/papers/${encodeURIComponent(paperId)}`);
}

export function getPaperPreviewQuestions(paperId: string) {
  return apiRequest<ExamQuestion[]>(`/examination/papers/${encodeURIComponent(paperId)}/questions`);
}
