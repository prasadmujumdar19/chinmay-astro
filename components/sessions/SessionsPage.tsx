/**
 * Sessions page component - user view of all their audio/video sessions
 * Feature 6 - Task 4.0.1
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSessionQueries } from '@/hooks/useSessionQueries';
import { SessionCard } from './SessionCard';

interface SessionsPageProps {
  userId: string;
}

export function SessionsPage({ userId }: SessionsPageProps) {
  const router = useRouter();
  const { sessions, loading, error } = useSessionQueries('all', userId);

  const handleViewSchedulingChat = (chatId: string) => {
    router.push(`/dashboard/consultations/${chatId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          data-testid="sessions-loading"
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800" data-testid="sessions-error">
          {error}
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
        <p className="text-gray-500" data-testid="sessions-empty">
          You haven&apos;t purchased any audio or video consultations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Sessions</h2>
        <p className="text-gray-600 mt-1">View and manage your audio and video consultations</p>
      </div>

      {/* Sessions List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            onViewSchedulingChat={handleViewSchedulingChat}
          />
        ))}
      </div>
    </div>
  );
}
