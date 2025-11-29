import { Timestamp } from 'firebase/firestore';
import type { Consultation, Message, ConsultationType, ChatType } from '@/types/consultation';

// Mock timestamp helper
const mockTimestamp = (date: Date = new Date()): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
  toMillis: () => date.getTime(),
  isEqual: () => false,
  valueOf: () => '',
  toJSON: () => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    type: 'timestamp',
  }),
});

// Base consultation fixture
const baseConsultation: Omit<Consultation, 'id' | 'status'> = {
  userId: 'user-123',
  userName: 'Test User',
  userEmail: 'test@example.com',
  consultationType: 'chat' as ConsultationType,
  chatType: 'consultation' as ChatType,
  threadNumber: 1,
  threadTitle: 'Consultation #1',
  createdAt: mockTimestamp(new Date('2025-01-01T10:00:00Z')),
  closedAt: null,
  lastActivityAt: mockTimestamp(new Date('2025-01-01T10:00:00Z')),
};

/**
 * Active Chat Consultation (user can send messages)
 */
export const mockActiveConsultation: Consultation = {
  id: 'consultation-active-123',
  ...baseConsultation,
  status: 'active',
};

/**
 * Closed Chat Consultation (admin has closed, but user can follow up)
 */
export const mockClosedConsultation: Consultation = {
  id: 'consultation-closed-456',
  ...baseConsultation,
  status: 'closed',
  threadNumber: 2,
  threadTitle: 'Consultation #2',
  createdAt: mockTimestamp(new Date('2025-01-02T10:00:00Z')),
  closedAt: mockTimestamp(new Date('2025-01-02T15:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-01-02T15:00:00Z')),
};

/**
 * Scheduling Chat Consultation (for audio/video scheduling)
 */
export const mockSchedulingConsultation: Consultation = {
  id: 'consultation-scheduling-789',
  ...baseConsultation,
  status: 'pending_scheduling',
  consultationType: 'audio',
  chatType: 'scheduling',
  threadNumber: null,
  threadTitle: 'Audio Session Scheduling',
  createdAt: mockTimestamp(new Date('2025-01-03T10:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-01-03T10:00:00Z')),
};

/**
 * Video Consultation - Scheduled
 */
export const mockScheduledVideoConsultation: Consultation = {
  id: 'consultation-video-scheduled-101',
  ...baseConsultation,
  status: 'scheduled',
  consultationType: 'video',
  chatType: 'scheduling',
  threadNumber: null,
  threadTitle: 'Video Session - Jan 10th',
  createdAt: mockTimestamp(new Date('2025-01-04T10:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-01-05T14:00:00Z')),
};

/**
 * Video Consultation - Completed
 */
export const mockCompletedVideoConsultation: Consultation = {
  id: 'consultation-video-completed-202',
  ...baseConsultation,
  status: 'completed',
  consultationType: 'video',
  chatType: null,
  threadNumber: null,
  threadTitle: 'Video Session - Jan 5th',
  createdAt: mockTimestamp(new Date('2025-01-05T10:00:00Z')),
  closedAt: mockTimestamp(new Date('2025-01-05T18:00:00Z')),
  lastActivityAt: mockTimestamp(new Date('2025-01-05T18:00:00Z')),
};

/**
 * Array of all mock consultations (for list views)
 */
export const mockConsultations: Consultation[] = [
  mockActiveConsultation,
  mockClosedConsultation,
  mockSchedulingConsultation,
  mockScheduledVideoConsultation,
  mockCompletedVideoConsultation,
];

// ===== MESSAGES =====

/**
 * User message (initial question)
 */
export const mockUserMessage1: Message = {
  id: 'msg-user-1',
  consultationId: 'consultation-active-123',
  senderId: 'user-123',
  senderRole: 'user',
  senderName: 'Test User',
  text: 'What does my birth chart say about my career prospects?',
  timestamp: mockTimestamp(new Date('2025-01-01T10:05:00Z')),
  readByAdmin: false,
  readByUser: true,
  isClosingMessage: false,
  isReopeningMessage: false,
};

/**
 * Admin response message
 */
export const mockAdminMessage1: Message = {
  id: 'msg-admin-1',
  consultationId: 'consultation-active-123',
  senderId: 'admin-456',
  senderRole: 'admin',
  senderName: 'Chinmay Jyotish',
  text: 'Based on your birth chart, I see strong indicators for success in creative fields...',
  timestamp: mockTimestamp(new Date('2025-01-01T14:00:00Z')),
  readByAdmin: true,
  readByUser: false,
  isClosingMessage: false,
  isReopeningMessage: false,
};

/**
 * User follow-up message
 */
export const mockUserMessage2: Message = {
  id: 'msg-user-2',
  consultationId: 'consultation-active-123',
  senderId: 'user-123',
  senderRole: 'user',
  senderName: 'Test User',
  text: 'Thank you! Can you tell me more about the timing of career changes?',
  timestamp: mockTimestamp(new Date('2025-01-01T16:00:00Z')),
  readByAdmin: false,
  readByUser: true,
  isClosingMessage: false,
  isReopeningMessage: false,
};

/**
 * Admin closing message (Send & Close)
 */
export const mockAdminClosingMessage: Message = {
  id: 'msg-admin-closing',
  consultationId: 'consultation-active-123',
  senderId: 'admin-456',
  senderRole: 'admin',
  senderName: 'Chinmay Jyotish',
  text: 'The best time for career transitions would be in the coming spring months. I hope this helps!',
  timestamp: mockTimestamp(new Date('2025-01-01T18:00:00Z')),
  readByAdmin: true,
  readByUser: false,
  isClosingMessage: true,
  isReopeningMessage: false,
};

/**
 * User follow-up on closed consultation
 */
export const mockUserFollowUpMessage: Message = {
  id: 'msg-user-followup',
  consultationId: 'consultation-closed-456',
  senderId: 'user-123',
  senderRole: 'user',
  senderName: 'Test User',
  text: 'Hi! I have one more quick question about what you mentioned earlier...',
  timestamp: mockTimestamp(new Date('2025-01-02T16:00:00Z')),
  readByAdmin: false,
  readByUser: true,
  isClosingMessage: false,
  isReopeningMessage: false,
};

/**
 * Admin reopening message (response to follow-up)
 */
export const mockAdminReopeningMessage: Message = {
  id: 'msg-admin-reopen',
  consultationId: 'consultation-closed-456',
  senderId: 'admin-456',
  senderRole: 'admin',
  senderName: 'Chinmay Jyotish',
  text: 'Of course! Let me clarify...',
  timestamp: mockTimestamp(new Date('2025-01-02T17:00:00Z')),
  readByAdmin: true,
  readByUser: false,
  isClosingMessage: false,
  isReopeningMessage: true,
};

/**
 * Array of messages for active consultation (conversation thread)
 */
export const mockActiveConsultationMessages: Message[] = [
  mockUserMessage1,
  mockAdminMessage1,
  mockUserMessage2,
];

/**
 * Array of messages for closed consultation (with closing message)
 */
export const mockClosedConsultationMessages: Message[] = [
  {
    ...mockUserMessage1,
    id: 'msg-closed-user-1',
    consultationId: 'consultation-closed-456',
    timestamp: mockTimestamp(new Date('2025-01-02T10:00:00Z')),
  },
  {
    ...mockAdminMessage1,
    id: 'msg-closed-admin-1',
    consultationId: 'consultation-closed-456',
    timestamp: mockTimestamp(new Date('2025-01-02T12:00:00Z')),
  },
  {
    ...mockAdminClosingMessage,
    id: 'msg-closed-admin-closing',
    consultationId: 'consultation-closed-456',
    timestamp: mockTimestamp(new Date('2025-01-02T15:00:00Z')),
  },
];

/**
 * Array of all mock messages (for testing message lists)
 */
export const mockMessages: Message[] = [
  ...mockActiveConsultationMessages,
  ...mockClosedConsultationMessages,
  mockUserFollowUpMessage,
  mockAdminReopeningMessage,
];

/**
 * Empty consultation (no messages yet)
 */
export const mockEmptyConsultation: Consultation = {
  id: 'consultation-empty-999',
  ...baseConsultation,
  status: 'active',
  threadNumber: 5,
  threadTitle: 'Consultation #5',
  createdAt: mockTimestamp(new Date()),
  lastActivityAt: mockTimestamp(new Date()),
};

/**
 * Helper to create a mock consultation with custom properties
 */
export const createMockConsultation = (overrides: Partial<Consultation> = {}): Consultation => ({
  ...mockActiveConsultation,
  ...overrides,
});

/**
 * Helper to create a mock message with custom properties
 */
export const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  ...mockUserMessage1,
  ...overrides,
});
