export type UserRole = 'Student' | 'Teacher' | 'Admin' | 'SuperAdmin';

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isProfileSetup: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  registrationTicket: string;
  email: string;
  password: string;
  fullName: string;
  role: 'Student';
  phoneNumber: string | null;
  subjectId: null;
  qualification: null;
  bio: null;
}

export interface VerifyOtpResponse {
  email: string;
  requiresAccountCreation: boolean;
  registrationTicket: string | null;
  registrationTicketExpiresAt: string | null;
  authentication: AuthResponse | null;
}
