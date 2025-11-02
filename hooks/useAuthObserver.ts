'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { getUserProfile } from '@/lib/firebase/users';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to observe Firebase auth state changes and sync with Zustand store
 * Automatically fetches user profile from Firestore when user signs in
 */
export function useAuthObserver() {
  const { setUser, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // User is signed in, fetch profile from Firestore
          // Retry with exponential backoff in case Cloud Function hasn't created profile yet
          let userProfile = await getUserProfile(firebaseUser.uid);
          let retries = 0;
          const maxRetries = 5;

          while (!userProfile && retries < maxRetries) {
            console.log(
              `User profile not found, retrying in ${Math.pow(2, retries)}s... (attempt ${retries + 1}/${maxRetries})`
            );
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
            userProfile = await getUserProfile(firebaseUser.uid);
            retries++;
          }

          if (userProfile) {
            setUser(userProfile);
          } else {
            // Profile still doesn't exist after retries
            console.error('User profile not found in Firestore after retries');
            clearAuth();
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          clearAuth();
        }
      } else {
        // User is signed out
        clearAuth();
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setUser, setLoading, clearAuth]);
}
