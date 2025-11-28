import { Timestamp } from 'firebase/firestore';

/**
 * Consultation Type - the type of consultation service
 */
export type ConsultationType = 'chat' | 'audio' | 'video';

/**
 * Chat Type - specific type of chat consultation
 * - consultation: Regular fortune-telling chat
 * - scheduling: Chat for scheduling audio/video sessions
 */
export type ChatType = 'consultation' | 'scheduling' | null;

/**
 * Consultation Status
 * - active: Consultation is ongoing, user can send messages
 * - closed: Admin has closed the consultation, but user can add follow-ups
 * - pending_scheduling: Audio/video consultation waiting for scheduling
 * - scheduled: Audio/video consultation has been scheduled
 * - completed: Audio/video consultation has been completed
 */
export type ConsultationStatus =
  | 'active'
  | 'closed'
  | 'pending_scheduling'
  | 'scheduled'
  | 'completed';

/**
 * Consultation Document
 * Stored in Firestore: consultations/{consultationId}
 *
 * Reference: TDD section 5.1.4 "Consultation Data Model" (lines 3580-3680)
 * Reference: PRD FR-CHAT-001 to FR-CHAT-020
 */
export interface Consultation {
  /** Firestore document ID */
  id: string;

  /** User ID (Firebase Auth UID) */
  userId: string;

  /** User's display name */
  userName: string;

  /** User's email */
  userEmail: string;

  /** Type of consultation (chat, audio, or video) */
  consultationType: ConsultationType;

  /** Chat type (consultation or scheduling) - null for audio/video */
  chatType: ChatType;

  /** Current status of the consultation */
  status: ConsultationStatus;

  /** Thread number for this user (sequential: 1, 2, 3...) */
  threadNumber: number | null;

  /** Human-readable title for the consultation thread */
  threadTitle: string;

  /** When the consultation was created */
  createdAt: Timestamp;

  /** When the consultation was closed (null if active) */
  closedAt: Timestamp | null;

  /** Last activity timestamp (updated on every message) */
  lastActivityAt: Timestamp;
}

/**
 * Message Document
 * Stored in Firestore: consultations/{consultationId}/messages/{messageId}
 *
 * Reference: TDD section 11.1.2 "Message Data Model" (lines 10070-10095)
 * Reference: PRD FR-CHAT-006, FR-CHAT-008
 */
export interface Message {
  /** Firestore document ID */
  id: string;

  /** Parent consultation ID */
  consultationId: string;

  /** Sender's user ID (Firebase Auth UID) */
  senderId: string;

  /** Sender's role (user or admin) */
  senderRole: 'user' | 'admin';

  /** Sender's display name */
  senderName: string;

  /** Message text content (max 2000 characters) */
  text: string;

  /** When the message was sent */
  timestamp: Timestamp;

  /** Whether admin has read this message */
  readByAdmin: boolean;

  /** Whether user has read this message */
  readByUser: boolean;

  /** True if this message closed the consultation */
  isClosingMessage: boolean;

  /** True if this message reopened a closed consultation */
  isReopeningMessage: boolean;
}

/**
 * Create Consultation Request
 * Used when calling createConsultation Cloud Function
 */
export interface CreateConsultationRequest {
  consultationType: ConsultationType;
  chatType?: ChatType;
  threadTitle: string;
}

/**
 * Create Consultation Response
 * Returned by createConsultation Cloud Function
 */
export interface CreateConsultationResponse {
  consultationId: string;
  threadNumber: number;
}

/**
 * Close Consultation Request
 * Used when admin calls closeConsultation Cloud Function
 */
export interface CloseConsultationRequest {
  consultationId: string;
  closingMessage: string;
}

/**
 * Send Message Request
 * Used when sending a new message
 */
export interface SendMessageRequest {
  consultationId: string;
  text: string;
}
