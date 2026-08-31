import { apiRequest } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest, VerifyOtpResponse } from '../types/auth';

export function loginStudent(payload: LoginRequest) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  });
}

export function registerStudent(payload: Omit<RegisterRequest, 'role' | 'subjectId' | 'qualification' | 'bio'>) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      ...payload,
      role: 'Student',
      subjectId: null,
      qualification: null,
      bio: null,
    } satisfies RegisterRequest),
  });
}

export function sendOtp(email: string) {
  return apiRequest<{ message: string }>('/auth/otp/send', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email: string, code: string) {
  return apiRequest<VerifyOtpResponse>('/auth/otp/verify', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, code }),
  });
}
