/**
 * Custom hook for subscribing to user credit updates
 * Provides real-time credit balance from Firestore
 */

'use client';

import { useState, useEffect } from 'react';
import { subscribeToCredits } from '@/lib/firestore/credits';
import { useAuthStore } from '@/stores/authStore';
import type { Credits } from '@/types/credits';

interface UseCreditsReturn {
  credits: Credits | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to subscribe to user's credit balance in real-time
 * Automatically subscribes when user is authenticated and unsubscribes on unmount
 */
export function useCredits(): UseCreditsReturn {
  const { user } = useAuthStore();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no user, return early with null credits
    if (!user) {
      setCredits(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Subscribe to credit updates
      const unsubscribe = subscribeToCredits(user.uid, newCredits => {
        setCredits(newCredits);
        setIsLoading(false);
      });

      // Cleanup subscription on unmount
      return unsubscribe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to credits';
      setError(errorMessage);
      setIsLoading(false);
      return undefined;
    }
  }, [user]);

  return { credits, isLoading, error };
}
