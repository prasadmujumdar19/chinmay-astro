/**
 * Session management panel - admin interface for managing sessions
 * Feature 6 - Task 4.0.2
 */

'use client';

import { useState } from 'react';
import { useSessionQueries } from '@/hooks/useSessionQueries';
import { createSchedulingChat } from '@/lib/sessions/createSchedulingChat';
import { updateSessionToCompleted } from '@/lib/sessions/updateSessionStatus';
import type { AudioVideoSession } from '@/types/sessions';
import { Timestamp } from 'firebase/firestore';

export function SessionManagementPanel() {
  const {
    sessions: pendingSessions,
    loading,
    error,
    refetch,
  } = useSessionQueries('pending_scheduling');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create scheduling chat for a session
  const handleCreateSchedulingChat = async (session: AudioVideoSession) => {
    setActionLoading(session.id);
    setActionError(null);

    try {
      await createSchedulingChat({
        sessionId: session.id,
        userId: session.userId,
        userName: session.userName,
        userEmail: session.userEmail,
        sessionType: session.type,
      });
      await refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to create scheduling chat');
    } finally {
      setActionLoading(null);
    }
  };

  // Mark session as completed
  const handleMarkAsCompleted = async (sessionId: string) => {
    setActionLoading(sessionId);
    setActionError(null);

    try {
      await updateSessionToCompleted(sessionId);
      await refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark session as completed');
    } finally {
      setActionLoading(null);
    }
  };

  // Format date helper
  const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          data-testid="admin-sessions-loading"
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800" data-testid="admin-sessions-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
        <p className="text-gray-600 mt-1">Manage audio and video consultation sessions</p>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{actionError}</p>
        </div>
      )}

      {/* Pending Sessions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Scheduling ({pendingSessions.length})
        </h3>

        {pendingSessions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500" data-testid="admin-sessions-empty">
              No pending sessions
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingSessions.map(session => (
              <div
                key={session.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                data-testid={`admin-session-card-${session.id}`}
              >
                {/* Session Info */}
                <div className="mb-3">
                  <h4 className="text-lg font-semibold capitalize">{session.type} Session</h4>
                  <p className="text-sm text-gray-600">{session.userName}</p>
                  <p className="text-sm text-gray-500">{session.userEmail}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {formatDate(session.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  {/* Create Scheduling Chat */}
                  {!session.relatedSessionId && (
                    <button
                      onClick={() => handleCreateSchedulingChat(session)}
                      disabled={actionLoading === session.id}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      data-testid={`create-scheduling-chat-${session.id}`}
                    >
                      {actionLoading === session.id ? 'Creating...' : 'Create Scheduling Chat'}
                    </button>
                  )}

                  {/* View Scheduling Chat */}
                  {session.relatedSessionId && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Scheduling Chat:</span>{' '}
                      <a
                        href={`/admin/consultations/${session.relatedSessionId}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Chat
                      </a>
                    </div>
                  )}

                  {/* Mark as Completed */}
                  <button
                    onClick={() => handleMarkAsCompleted(session.id)}
                    disabled={actionLoading === session.id}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    data-testid={`mark-completed-${session.id}`}
                  >
                    {actionLoading === session.id ? 'Updating...' : 'Mark as Completed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
