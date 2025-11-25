/**
 * Type definitions for audio/video sessions and scheduling
 * Feature 6: Audio/Video Consultation & Scheduling
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Session types
 */
export type SessionType = 'audio' | 'video';

/**
 * Session status lifecycle
 * Audio/Video: pending_scheduling → scheduled → completed
 */
export type SessionStatus = 'pending_scheduling' | 'scheduled' | 'completed';

/**
 * Chat subtype for scheduling coordination
 */
export type ChatType = 'consultation' | 'scheduling' | null;

/**
 * Audio/Video Session interface
 * Stored in Firestore consultations collection with type='audio' or type='video'
 */
export interface AudioVideoSession {
  // Identification
  id: string;
  userId: string;

  // Denormalized user data (for admin views)
  userName: string;
  userEmail: string;

  // Session type
  type: SessionType;
  chatType: null; // Always null for audio/video sessions

  // Status lifecycle
  status: SessionStatus;

  // Thread identification (null for audio/video sessions)
  threadNumber: null;
  threadTitle: null;

  // Scheduling relationship
  relatedSessionId: string | null; // Points to scheduling chat consultation
  scheduledDateTime: Timestamp | null; // Confirmed date/time for session
  meetingLink: string | null; // Google Meet/Zoom URL

  // Timestamps
  createdAt: Timestamp; // When session was purchased
  lastActivityAt: Timestamp; // Last status change
  closedAt: null; // Not used for sessions
  completedAt: Timestamp | null; // When session was marked complete

  // Message count (always 0 for sessions)
  messageCount: number;
  unreadByAdmin: number;

  // Credit tracking
  creditDeducted: boolean; // Always true for sessions
  creditType: SessionType;
}

/**
 * Scheduling Chat interface
 * Stored in Firestore consultations collection with type='chat' and chatType='scheduling'
 */
export interface SchedulingChat {
  // Identification
  id: string;
  userId: string;

  // Denormalized user data
  userName: string;
  userEmail: string;

  // Chat type
  type: 'chat';
  chatType: 'scheduling';

  // Status
  status: 'active' | 'closed';

  // Thread identification
  threadNumber: null; // No thread number for scheduling chats
  threadTitle: string; // "Audio Session Scheduling" or "Video Session Scheduling"

  // Session relationship
  relatedSessionId: string; // Points back to audio/video session
  scheduledDateTime: null; // Not used for chats
  meetingLink: null; // Not stored in chat

  // Timestamps
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
  closedAt: Timestamp | null;
  completedAt: null;

  // Message count
  messageCount: number;
  unreadByAdmin: number;

  // Credit tracking
  creditDeducted: false; // Never deducts credit for scheduling chats
  creditType: SessionType; // Matches the related session type
}

/**
 * Parameters for creating a new session
 */
export interface CreateSessionParams {
  userId: string;
  userName: string;
  userEmail: string;
  type: SessionType;
  creditType: SessionType;
}

/**
 * Parameters for creating a scheduling chat
 */
export interface CreateSchedulingChatParams {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  sessionType: SessionType;
}

/**
 * Parameters for sending meeting link via email
 */
export interface SendMeetingLinkParams {
  sessionId: string;
  meetingLink: string;
  userName: string;
  userEmail: string;
  sessionType: SessionType;
  scheduledDateTime: Date;
}
