/**
 * Clausentis Authentication Error Classifier
 * Standardizes raw Supabase Auth and network errors into structured, user-friendly messages.
 */

export type AuthErrorCode =
  | 'EMAIL_RATE_LIMITED'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_MISMATCH'
  | 'NETWORK_ERROR'
  | 'SUPABASE_ERROR';

export interface AuthErrorDetails {
  code: AuthErrorCode;
  message: string;
  technicalDetails?: string;
  suggestion?: string;
}

/**
 * Classifies an auth error into an actionable, user-friendly response.
 * Never exposes raw technical errors like "email rate limit exceeded" as the primary message.
 */
export function classifyAuthError(error: unknown): AuthErrorDetails {
  if (!error) {
    return {
      code: 'SUPABASE_ERROR',
      message: 'An unknown error occurred during authentication.',
    };
  }

  const errObj = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
  let rawMsg = '';
  if (typeof error === 'string') {
    rawMsg = error;
  } else if (typeof errObj.message === 'string') {
    rawMsg = errObj.message;
  } else if (typeof errObj.msg === 'string') {
    rawMsg = errObj.msg;
  } else if (typeof errObj.error_description === 'string') {
    rawMsg = errObj.error_description;
  }

  const rawLower = rawMsg.toLowerCase();
  const status: number = Number(errObj.status || errObj.code || 0);
  const errorCode: string = String(errObj.error_code || errObj.name || '').toLowerCase();

  const technicalDetails = [
    errorCode ? `[${errorCode}]` : null,
    status ? `Status ${status}` : null,
    rawMsg || null,
  ]
    .filter(Boolean)
    .join(' - ') || 'No secondary details available';

  // 1. Email rate limiting (HTTP 429 or specific Supabase error codes)
  if (
    status === 429 ||
    errorCode === 'over_email_send_rate_limit' ||
    rawLower.includes('email rate limit') ||
    rawLower.includes('rate limit exceeded') ||
    rawLower.includes('too many requests') ||
    rawLower.includes('over_email_send_rate_limit')
  ) {
    return {
      code: 'EMAIL_RATE_LIMITED',
      message: 'Email verification is temporarily unavailable. Please try again later.',
      suggestion: 'Supabase email send quotas refresh periodically. You can also sign in directly if you already have an account.',
      technicalDetails,
    };
  }

  // 2. Email already registered
  if (
    errorCode === 'user_already_exists' ||
    errorCode === 'email_exists' ||
    rawLower.includes('user already registered') ||
    rawLower.includes('already registered') ||
    rawLower.includes('email already exists') ||
    rawLower.includes('already in use')
  ) {
    return {
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'An account with this email address already exists. Please sign in instead or reset your password.',
      suggestion: 'Use the Sign In page to access your existing account.',
      technicalDetails,
    };
  }

  // 3. Invalid email format
  if (
    (errorCode === 'validation_failed' && rawLower.includes('email')) ||
    rawLower.includes('invalid email') ||
    rawLower.includes('email address is invalid') ||
    rawLower.includes('invalid_email') ||
    rawLower.includes('malformed email')
  ) {
    return {
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid official email address (e.g. officer@organisation.gov.in).',
      suggestion: 'Check the domain name and ensure there are no leading or trailing spaces.',
      technicalDetails,
    };
  }

  // 4. Password mismatch
  if (
    rawLower.includes('password mismatch') ||
    rawLower.includes('passwords do not match') ||
    rawLower.includes('passwords must match')
  ) {
    return {
      code: 'PASSWORD_MISMATCH',
      message: 'Passwords do not match. Please ensure both entered passwords are identical.',
      suggestion: 'Re-enter your password in both fields.',
      technicalDetails,
    };
  }

  // 5. Weak password
  if (
    errorCode === 'weak_password' ||
    rawLower.includes('weak password') ||
    rawLower.includes('password should be at least') ||
    rawLower.includes('at least 6 characters') ||
    rawLower.includes('password is too short')
  ) {
    return {
      code: 'WEAK_PASSWORD',
      message: 'Password is too weak. Please choose a password with at least 6 characters, including numbers and letters.',
      suggestion: 'Use a strong passphrase with mixed case, digits, or symbols.',
      technicalDetails,
    };
  }

  // 6. Network / Connectivity error
  if (
    rawLower.includes('failed to fetch') ||
    rawLower.includes('networkerror') ||
    rawLower.includes('network error') ||
    rawLower.includes('fetch failed') ||
    rawLower.includes('timeout') ||
    rawLower.includes('econnrefused')
  ) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the authentication server. Please check your network connection and try again.',
      suggestion: 'Ensure your internet connection is active and firewall settings permit outbound HTTPS.',
      technicalDetails,
    };
  }

  // 7. Supabase generic / other errors
  return {
    code: 'SUPABASE_ERROR',
    message:
      rawMsg.length > 0 && !rawMsg.includes('{"')
        ? rawMsg
        : 'An unexpected authentication error occurred. Please try again or contact support.',
    technicalDetails,
  };
}
