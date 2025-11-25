/**
 * Test fixtures for audio/video sessions and scheduling chats
 * Used in unit and integration tests for Feature 6
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Mock Firestore Timestamp helper
 */
const mockTimestamp = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
  toMillis: () => date.getTime(),
  isEqual: () => false,
  valueOf: () => date.toISOString(),
  toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
});

/**
 * Mock audio session - pending scheduling (just purchased)
 */
export const mockAudioSessionPending = {
  id: 'session_audio_001',
  userId: 'test-user-123',
  userName: 'Test User',
  userEmail: 'test@example.com',
  type: 'audio' as const,
  chatType: null,
  status: 'pending_scheduling' as const,
  threadNumber: null,
  threadTitle: null,
  relatedSessionId: null, // No scheduling chat yet
  scheduledDateTime: null,
  meetingLink: null,
  createdAt: mockTimestamp(new Date('2025-10-28T10:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-10-28T10:00:00Z')),
  closedAt: null,
  completedAt: null,
  messageCount: 0,
  unreadByAdmin: 0,
  creditDeducted: true,
  creditType: 'audio' as const,
};

/**
 * Mock video session - pending scheduling
 */
export const mockVideoSessionPending = {
  id: 'session_video_001',
  userId: 'test-user-123',
  userName: 'Test User',
  userEmail: 'test@example.com',
  type: 'video' as const,
  chatType: null,
  status: 'pending_scheduling' as const,
  threadNumber: null,
  threadTitle: null,
  relatedSessionId: null,
  scheduledDateTime: null,
  meetingLink: null,
  createdAt: mockTimestamp(new Date('2025-10-28T11:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-10-28T11:00:00Z')),
  closedAt: null,
  completedAt: null,
  messageCount: 0,
  unreadByAdmin: 0,
  creditDeducted: true,
  creditType: 'video' as const,
};

/**
 * Mock audio session - scheduled (with scheduling chat linked)
 */
export const mockAudioSessionScheduled = {
  id: 'session_audio_002',
  userId: 'test-user-123',
  userName: 'Test User',
  userEmail: 'test@example.com',
  type: 'audio' as const,
  chatType: null,
  status: 'scheduled' as const,
  threadNumber: null,
  threadTitle: null,
  relatedSessionId: 'sched_chat_001', // Linked to scheduling chat
  scheduledDateTime: mockTimestamp(new Date('2025-11-01T10:00:00Z')),
  meetingLink: 'https://meet.google.com/xyz-abc-def',
  createdAt: mockTimestamp(new Date('2025-10-28T10:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-10-29T14:00:00Z')),
  closedAt: null,
  completedAt: null,
  messageCount: 0,
  unreadByAdmin: 0,
  creditDeducted: true,
  creditType: 'audio' as const,
};

/**
 * Mock video session - scheduled
 */
export const mockVideoSessionScheduled = {
  id: 'session_video_002',
  userId: 'test-user-456',
  userName: 'Another User',
  userEmail: 'another@example.com',
  type: 'video' as const,
  chatType: null,
  status: 'scheduled' as const,
  threadNumber: null,
  threadTitle: null,
  relatedSessionId: 'sched_chat_002',
  scheduledDateTime: mockTimestamp(new Date('2025-11-02T15:00:00Z')),
  meetingLink: 'https://zoom.us/j/1234567890',
  createdAt: mockTimestamp(new Date('2025-10-29T09:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-10-30T11:00:00Z')),
  closedAt: null,
  completedAt: null,
  messageCount: 0,
  unreadByAdmin: 0,
  creditDeducted: true,
  creditType: 'video' as const,
};

/**
 * Mock audio session - completed
 */
export const mockAudioSessionCompleted = {
  id: 'session_audio_003',
  userId: 'test-user-123',
  userName: 'Test User',
  userEmail: 'test@example.com',
  type: 'audio' as const,
  chatType: null,
  status: 'completed' as const,
  threadNumber: null,
  threadTitle: null,
  relatedSessionId: 'sched_chat_003',
  scheduledDateTime: mockTimestamp(new Date('2025-10-25T10:00:00Z')),
  meetingLink: 'https://meet.google.com/completed-session',
  createdAt: mockTimestamp(new Date('2025-10-20T10:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-10-25T11:00:00Z')),
  closedAt: null,
  completedAt: mockTimestamp(new Date('2025-10-25T11:00:00Z')),
  messageCount: 0,
  unreadByAdmin: 0,
  creditDeducted: true,
  creditType: 'audio' as const,
};

/**
 * Mock scheduling chat - linked to audio session (active)
 */
export const mockSchedulingChatActive = {
  id: 'sched_chat_001',
  userId: 'test-user-123',
  userName: 'Test User',
  userEmail: 'test@example.com',
  type: 'chat' as const,
  chatType: 'scheduling' as const,
  status: 'active' as const,
  threadNumber: null,
  threadTitle: 'Audio Session Scheduling',
  relatedSessionId: 'session_audio_002', // Links back to audio session
  scheduledDateTime: null,
  meetingLink: null,
  createdAt: mockTimestamp(new Date('2025-10-28T10:05:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-10-29T14:00:00Z')),
  closedAt: null,
  completedAt: null,
  messageCount: 6,
  unreadByAdmin: 1,
  creditDeducted: false, // No credit deducted for scheduling chat
  creditType: 'audio' as const,
};

/**
 * Mock scheduling chat - linked to video session (closed)
 */
export const mockSchedulingChatClosed = {
  id: 'sched_chat_002',
  userId: 'test-user-456',
  userName: 'Another User',
  userEmail: 'another@example.com',
  type: 'chat' as const,
  chatType: 'scheduling' as const,
  status: 'closed' as const,
  threadNumber: null,
  threadTitle: 'Video Session Scheduling',
  relatedSessionId: 'session_video_002',
  scheduledDateTime: null,
  meetingLink: null,
  createdAt: mockTimestamp(new Date('2025-10-29T09:05:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-10-30T11:00:00Z')),
  closedAt: mockTimestamp(new Date('2025-10-30T11:00:00Z')),
  completedAt: null,
  messageCount: 8,
  unreadByAdmin: 0,
  creditDeducted: false,
  creditType: 'video' as const,
};

/**
 * Array of all session fixtures (for iteration in tests)
 */
export const allSessionFixtures = [
  mockAudioSessionPending,
  mockVideoSessionPending,
  mockAudioSessionScheduled,
  mockVideoSessionScheduled,
  mockAudioSessionCompleted,
];

/**
 * Array of all scheduling chat fixtures
 */
export const allSchedulingChatFixtures = [mockSchedulingChatActive, mockSchedulingChatClosed];
