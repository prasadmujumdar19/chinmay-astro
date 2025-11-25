/**
 * Session card component - displays individual session details
 * Feature 6 - Task 4.0.3
 */

'use client';

import type { AudioVideoSession } from '@/types/sessions';
import { Timestamp } from 'firebase/firestore';

interface SessionCardProps {
  session: AudioVideoSession;
  onViewSchedulingChat?: (sessionId: string) => void;
}

export function SessionCard({ session, onViewSchedulingChat }: SessionCardProps) {
  // Format date helper
  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'Not scheduled';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge colors
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending_scheduling':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status text
  const formatStatus = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      data-testid={`session-card-${session.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 capitalize">{session.type} Session</h3>
          <p className="text-sm text-gray-500">Created {formatDate(session.createdAt)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}
          data-testid={`session-status-${session.id}`}
        >
          {formatStatus(session.status)}
        </span>
      </div>

      {/* Session Details */}
      <div className="space-y-2">
        {/* Scheduled Date/Time */}
        {session.scheduledDateTime && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 mr-2">Scheduled:</span>
            <span className="text-gray-600" data-testid={`session-scheduled-${session.id}`}>
              {formatDate(session.scheduledDateTime)}
            </span>
          </div>
        )}

        {/* Meeting Link */}
        {session.meetingLink && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 mr-2">Meeting Link:</span>
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              data-testid={`session-meeting-link-${session.id}`}
            >
              Join Meeting
            </a>
          </div>
        )}

        {/* Completed Date */}
        {session.completedAt && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 mr-2">Completed:</span>
            <span className="text-gray-600" data-testid={`session-completed-${session.id}`}>
              {formatDate(session.completedAt)}
            </span>
          </div>
        )}

        {/* Scheduling Chat Link */}
        {session.relatedSessionId && onViewSchedulingChat && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => onViewSchedulingChat(session.relatedSessionId!)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              data-testid={`view-scheduling-chat-${session.id}`}
            >
              View Scheduling Chat →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
