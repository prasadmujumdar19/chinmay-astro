/**
 * useUserProfile hook - Fetch and update user profile with caching
 * Reference: TDD section 7.1 "Frontend Architecture" (lines 5354-5360)
 *
 * Provides a React hook for managing user profile data with:
 * - Automatic fetching on mount
 * - Loading and error states
 * - Update functionality
 * - Optimistic updates (optional)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, BirthDetails } from '@/types/user';
import { getUserProfile, updateUserProfile } from '@/lib/api/users';

interface UseUserProfileReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<BirthDetails>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage user profile data
 *
 * @param userId - The user ID to fetch profile for
 * @returns Profile data, loading state, error state, and update functions
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { user, isLoading, error, updateProfile } = useUserProfile('user-123');
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return <div>{user.name}</div>;
 * }
 * ```
 */
export function useUserProfile(userId: string | null): UseUserProfileReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const profile = await getUserProfile(userId);
      setUser(profile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch on mount and when userId changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update user profile
  const updateProfile = useCallback(
    async (updates: Partial<BirthDetails>) => {
      if (!userId) {
        throw new Error('User ID is required to update profile');
      }

      try {
        setError(null);

        // Optimistic update (update UI before API call)
        if (user) {
          setUser({
            ...user,
            ...updates,
            updatedAt: new Date(),
          });
        }

        // Make API call
        await updateUserProfile(userId, updates);

        // Refetch to ensure data consistency
        await fetchProfile();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMessage);

        // Refetch to revert any optimistic updates
        await fetchProfile();

        throw err; // Re-throw for caller to handle
      }
    },
    [userId, user, fetchProfile]
  );

  // Refetch user profile (useful after external updates)
  const refetch = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    user,
    isLoading,
    error,
    updateProfile,
    refetch,
  };
}
