const API_URL = import.meta.env.VITE_API_BASE_URL ;

type RequestOptions = RequestInit & {
  auth?: boolean;
};

interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: string[];
}

interface ApiEnvelope {
  error?: ApiErrorPayload;
  message?: string;
  title?: string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details: string[];

  constructor(
    message: string,
    status: number,
    code?: string,
    details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const subscriptionRequiredEventName = 'exam-munnodi:subscription-required';

export interface SubscriptionRequiredEventDetail {
  message: string;
}

export function isSubscriptionRequiredError(error: unknown) {
  return error instanceof ApiRequestError
    && error.status === 403
    && (error.code === 'SUBSCRIPTION_REQUIRED' || error.code === 'SUBSCRIPTION_LIMIT_REACHED');
}

export function listenForSubscriptionRequired(
  callback: (detail: SubscriptionRequiredEventDetail) => void,
) {
  const listener = (event: Event) => {
    callback((event as CustomEvent<SubscriptionRequiredEventDetail>).detail);
  };

  window.addEventListener(subscriptionRequiredEventName, listener);
  return () => window.removeEventListener(subscriptionRequiredEventName, listener);
}

function notifySubscriptionRequired(message: string) {
  window.dispatchEvent(new CustomEvent<SubscriptionRequiredEventDetail>(subscriptionRequiredEventName, {
    detail: { message },
  }));
}

function readToken() {
  return localStorage.getItem('student_access_token');
}

function unwrapResponse<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const token = readToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('student_access_token');
    localStorage.removeItem('student_auth');
  }

  if (!response.ok) {
    let message = 'Request failed. Please try again.';
    let code: string | undefined;
    let details: string[] = [];

    try {
      const errorBody = await response.json() as ApiEnvelope;
      const apiError = errorBody.error;

      message = apiError?.message || errorBody.message || errorBody.title || message;
      code = apiError?.code;
      details = apiError?.details || [];
    } catch {
      message = response.statusText || message;
    }

    const apiError = new ApiRequestError(message, response.status, code, details);
    if (isSubscriptionRequiredError(apiError)) {
      notifySubscriptionRequired(message);
    }

    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;

  return unwrapResponse<T>(JSON.parse(text));
}
