import { ApiRequestError, isSubscriptionRequiredError } from '../services/api';

export interface AccountRestriction {
  type: 'suspended' | 'deactivated';
  message: string;
}

export function getAccountRestriction(error: unknown): AccountRestriction | null {
  if (!(error instanceof ApiRequestError) || error.status !== 403) return null;

  const message = error.message.trim();
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes('suspended until')) {
    return { type: 'suspended', message };
  }

  if (normalizedMessage.includes('deactivated')) {
    return {
      type: 'deactivated',
      message: 'Your account is currently deactivated. Please contact support for assistance.',
    };
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (isSubscriptionRequiredError(error)) return '';
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export function getLoginErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return 'We couldn’t sign you in. Check your email and password, or create an account if you’re new.';
    }

    if (error.status === 403) {
      const restriction = getAccountRestriction(error);
      if (restriction) return restriction.message;

      const message = error.message.trim();
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes('locked')) {
        return 'This account is temporarily locked because of unsuccessful sign-in attempts. Please try again later.';
      }

      if (normalizedMessage.includes('verify') || normalizedMessage.includes('email')) {
        return 'Please verify your email before continuing.';
      }

      return 'You cannot access this account right now. Please contact support for assistance.';
    }
  }

  return fallback;
}

export function getRegisterErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 429) {
      return 'You have reached the verification code limit. Please try again later.';
    }

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
