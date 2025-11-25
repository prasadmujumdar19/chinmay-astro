/**
 * Test utilities for consultation/session management
 * Helper functions for creating test consultations and sessions
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Session types
 */
export type SessionType = 'audio' | 'video';
export type SessionStatus = 'pending_scheduling' | 'scheduled' | 'completed';
export type ChatType = 'consultation' | 'scheduling' | null;

/**
 * Mock Firestore Timestamp helper
 */
export function createMockTimestamp(date: Date = new Date()): Timestamp {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: () => false,
    valueOf: () => date.toISOString(),
    toJSON: () => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    }),
  };
}

/**
 * Create a test audio/video session
 */
export function createTestSession(params: {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: SessionType;
  status?: SessionStatus;
  relatedSessionId?: string | null;
  scheduledDateTime?: Date | null;
  meetingLink?: string | null;
  createdAt?: Date;
  completedAt?: Date | null;
  creditDeducted?: boolean;
}) {
  const now = new Date();

  return {
    id: params.id || `session_${params.type}_${Date.now()}`,
    userId: params.userId || 'test-user-123',
    userName: params.userName || 'Test User',
    userEmail: params.userEmail || 'test@example.com',
    type: params.type,
    chatType: null,
    status: params.status || 'pending_scheduling',
    threadNumber: null,
    threadTitle: null,
    relatedSessionId: params.relatedSessionId !== undefined ? params.relatedSessionId : null,
    scheduledDateTime: params.scheduledDateTime
      ? createMockTimestamp(params.scheduledDateTime)
      : null,
    meetingLink: params.meetingLink !== undefined ? params.meetingLink : null,
    createdAt: createMockTimestamp(params.createdAt || now),
    lastActivityAt: createMockTimestamp(params.createdAt || now),
    closedAt: null,
    completedAt: params.completedAt ? createMockTimestamp(params.completedAt) : null,
    messageCount: 0,
    unreadByAdmin: 0,
    creditDeducted: params.creditDeducted !== undefined ? params.creditDeducted : true,
    creditType: params.type,
  };
}

/**
 * Create a test scheduling chat
 */
export function createTestSchedulingChat(params: {
  id?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  sessionType: SessionType;
  relatedSessionId: string;
  status?: 'active' | 'closed';
  messageCount?: number;
  unreadByAdmin?: number;
  createdAt?: Date;
  closedAt?: Date | null;
}) {
  const now = new Date();

  return {
    id: params.id || `sched_chat_${Date.now()}`,
    userId: params.userId || 'test-user-123',
    userName: params.userName || 'Test User',
    userEmail: params.userEmail || 'test@example.com',
    type: 'chat' as const,
    chatType: 'scheduling' as const,
    status: params.status || 'active',
    threadNumber: null,
    threadTitle: `${params.sessionType === 'audio' ? 'Audio' : 'Video'} Session Scheduling`,
    relatedSessionId: params.relatedSessionId,
    scheduledDateTime: null,
    meetingLink: null,
    createdAt: createMockTimestamp(params.createdAt || now),
    lastActivityAt: createMockTimestamp(params.createdAt || now),
    closedAt: params.closedAt ? createMockTimestamp(params.closedAt) : null,
    completedAt: null,
    messageCount: params.messageCount || 0,
    unreadByAdmin: params.unreadByAdmin || 0,
    creditDeducted: false, // Scheduling chats never deduct credits
    creditType: params.sessionType,
  };
}

/**
 * Create a paired session and scheduling chat (bidirectional linking)
 */
export function createTestSessionWithSchedulingChat(params: {
  userId?: string;
  userName?: string;
  userEmail?: string;
  sessionType: SessionType;
  sessionStatus?: SessionStatus;
  scheduledDateTime?: Date | null;
  meetingLink?: string | null;
  chatStatus?: 'active' | 'closed';
  messageCount?: number;
}) {
  const sessionId = `session_${params.sessionType}_${Date.now()}`;
  const chatId = `sched_chat_${Date.now()}`;

  const session = createTestSession({
    id: sessionId,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    type: params.sessionType,
    status: params.sessionStatus,
    relatedSessionId: chatId,
    scheduledDateTime: params.scheduledDateTime,
    meetingLink: params.meetingLink,
  });

  const schedulingChat = createTestSchedulingChat({
    id: chatId,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    sessionType: params.sessionType,
    relatedSessionId: sessionId,
    status: params.chatStatus,
    messageCount: params.messageCount,
  });

  return {
    session,
    schedulingChat,
  };
}

/**
 * Helper: Get session title for display
 */
export function getSessionTitle(type: SessionType, status: SessionStatus): string {
  const typeLabel = type === 'audio' ? 'Audio' : 'Video';

  switch (status) {
    case 'pending_scheduling':
      return `${typeLabel} Session - Pending Scheduling`;
    case 'scheduled':
      return `${typeLabel} Session - Scheduled`;
    case 'completed':
      return `${typeLabel} Session - Completed`;
    default:
      return `${typeLabel} Session`;
  }
}

/**
 * Helper: Check if session can transition to new status
 */
export function canTransitionSessionStatus(
  currentStatus: SessionStatus,
  newStatus: SessionStatus
): boolean {
  const validTransitions: Record<SessionStatus, SessionStatus[]> = {
    pending_scheduling: ['scheduled'],
    scheduled: ['completed'],
    completed: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Helper: Get next valid statuses for a session
 */
export function getNextValidStatuses(currentStatus: SessionStatus): SessionStatus[] {
  const validTransitions: Record<SessionStatus, SessionStatus[]> = {
    pending_scheduling: ['scheduled'],
    scheduled: ['completed'],
    completed: [],
  };

  return validTransitions[currentStatus] || [];
}

/**
 * Helper: Check if session requires scheduling chat
 */
export function requiresSchedulingChat(status: SessionStatus): boolean {
  return status !== 'pending_scheduling';
}

/**
 * Helper: Check if session is terminal (no further status changes)
 */
export function isTerminalStatus(status: SessionStatus): boolean {
  return status === 'completed';
}

/**
 * Helper: Get status badge color (for UI)
 */
export function getStatusBadgeColor(status: SessionStatus): string {
  switch (status) {
    case 'pending_scheduling':
      return 'yellow';
    case 'scheduled':
      return 'blue';
    case 'completed':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Helper: Format scheduled date/time for display
 */
export function formatScheduledDateTime(date: Date | null): string {
  if (!date) return 'Not scheduled';

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Helper: Validate meeting link format
 */
export function isValidMeetingLink(link: string | null): boolean {
  if (!link) return false;

  // Check for Google Meet or Zoom URL patterns
  const googleMeetPattern = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  const zoomPattern = /^https:\/\/zoom\.us\/j\/\d{9,11}(\?pwd=.+)?$/;

  return googleMeetPattern.test(link) || zoomPattern.test(link);
}
