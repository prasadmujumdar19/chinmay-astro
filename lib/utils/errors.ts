/**
 * Firebase Auth error codes
 */
export const AUTH_ERROR_CODES = {
  POPUP_CLOSED: 'auth/popup-closed-by-user',
  POPUP_BLOCKED: 'auth/popup-blocked',
  NETWORK_ERROR: 'auth/network-request-failed',
} as const;

/**
 * Map Firebase Auth error codes to user-friendly messages
 * @param errorCode - Firebase error code
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case AUTH_ERROR_CODES.POPUP_CLOSED:
      return 'Sign-in cancelled. Please try again.';
    case AUTH_ERROR_CODES.POPUP_BLOCKED:
      return 'Popup blocked by browser. Please allow popups and try again.';
    case AUTH_ERROR_CODES.NETWORK_ERROR:
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Handle Firebase Auth errors with user-friendly messages
 * @param error - Error object from Firebase Auth
 * @throws Error with user-friendly message
 */
export function handleFirebaseAuthError(error: any): never {
  const errorCode = error?.code || '';
  const message = getAuthErrorMessage(errorCode);
  throw new Error(message);
}
