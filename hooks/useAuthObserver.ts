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
          const userProfile = await getUserProfile(firebaseUser.uid);

          if (userProfile) {
            setUser(userProfile);
          } else {
            // Profile doesn't exist yet (will be created by Cloud Function)
            console.warn('User profile not found in Firestore');
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
