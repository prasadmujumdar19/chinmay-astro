/**
 * Custom hook for querying audio/video sessions
 * Feature 6 - Task 4.0.5
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AudioVideoSession } from '@/types/sessions';
import {
  getPendingSessions,
  getScheduledSessions,
  getCompletedSessions,
  getAllUserSessions,
} from '@/lib/sessions/queries';

interface UseSessionQueriesReturn {
  sessions: AudioVideoSession[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch sessions by status
 * @param status - Session status to filter by ('pending_scheduling' | 'scheduled' | 'completed' | 'all')
 * @param userId - Optional user ID (if not provided, fetches all sessions - admin view)
 * @returns Sessions array, loading state, error, and refetch function
 */
export function useSessionQueries(
  status: 'pending_scheduling' | 'scheduled' | 'completed' | 'all',
  userId?: string
): UseSessionQueriesReturn {
  const [sessions, setSessions] = useState<AudioVideoSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result: AudioVideoSession[] = [];

      if (status === 'all' && userId) {
        result = await getAllUserSessions(userId);
      } else if (status === 'pending_scheduling') {
        result = await getPendingSessions(userId);
      } else if (status === 'scheduled') {
        result = await getScheduledSessions(userId);
      } else if (status === 'completed' && userId) {
        result = await getCompletedSessions(userId);
      } else {
        throw new Error('Invalid status or missing userId for completed sessions');
      }

      setSessions(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [status, userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
}
