import { ApiRequestError } from '../services/api';

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export function getLoginErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return 'The email or password is not correct. Please check and try again.';
    }

    if (error.status === 403) {
      return error.message.includes('locked')
        ? 'This account is temporarily locked. Please try again later.'
        : 'Please verify your email before continuing.';
    }
  }

  return fallback;
}

export function getRegisterErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) {
      return 'An account already exists with this email. Please sign in or use another email.';
    }

    if (error.status === 400 && error.details.length) {
      const passwordDetail = error.details.find((detail) => detail.toLowerCase().includes('password'));
      if (passwordDetail) {
        return 'Use a stronger password with at least 8 characters.';
      }

      return 'Please check the highlighted details and try again.';
    }
  }

  return fallback;
}
