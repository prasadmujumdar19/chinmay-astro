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
import { handleFirebaseAuthError } from '@/lib/utils/errors';

// Initialize Firebase Auth
export const auth: Auth = getAuth(firebaseApp);

/**
 * Sign in with Google using popup
 * @returns UserCredential on success
 * @throws Error with user-friendly message on failure
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    handleFirebaseAuthError(error);
  }
}

/**
 * Sign out the current user and clear auth state
 * Clears both Firebase Auth session and Zustand store
 * @throws Error if sign-out fails
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
