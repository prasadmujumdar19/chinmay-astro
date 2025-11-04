'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { getUserProfile } from '@/lib/firebase/users';
import { useAuthStore } from '@/stores/authStore';

/**
 * Retry fetching user profile with exponential backoff
 * Handles race condition where Cloud Function creates profile after sign-in
 */
async function fetchUserProfileWithRetry(
  uid: string,
  maxAttempts = 5,
  initialDelay = 500
): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Auth] Fetching user profile (attempt ${attempt}/${maxAttempts})...`);

    const userProfile = await getUserProfile(uid);

    if (userProfile) {
      console.log('[Auth] User profile loaded successfully');
      return userProfile;
    }

    if (attempt < maxAttempts) {
      const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`[Auth] Profile not found yet, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('[Auth] Failed to load user profile after all retries');
  return null;
}

/**
 * Hook to observe Firebase auth state changes and sync with Zustand store
 * Automatically fetches user profile from Firestore when user signs in
 * Includes retry logic to handle Cloud Function race condition
 */
export function useAuthObserver() {
  const { setUser, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          console.log('[Auth] User authenticated:', firebaseUser.email);

          // Fetch profile with retry logic (handles Cloud Function delay)
          const userProfile = await fetchUserProfileWithRetry(firebaseUser.uid);

          if (userProfile) {
            console.log('[Auth] Setting user in store');
            setUser(userProfile);
          } else {
            // Profile still doesn't exist after retries - new user needs manual profile creation
            console.warn(
              '[Auth] User profile not found after retries. User may need to complete profile setup.'
            );
            clearAuth();
          }
        } catch (error) {
          console.error('[Auth] Error fetching user profile:', error);
          clearAuth();
        }
      } else {
        // User is signed out
        console.log('[Auth] User signed out');
        clearAuth();
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setUser, setLoading, clearAuth]);
}
