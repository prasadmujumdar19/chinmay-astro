import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';
import { firebaseApp } from './config';
import { useAuthStore } from '@/stores/authStore';

// Initialize Firebase Auth
export const auth: Auth = getAuth(firebaseApp);

/**
 * Sign in with Google using popup
 * @throws Error with user-friendly message on failure
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    // Handle specific error cases
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup blocked by browser. Please allow popups and try again.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    // Generic error
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Sign out the current user and clear auth state
 */
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    // Clear Zustand store
    useAuthStore.getState().clearAuth();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
}
