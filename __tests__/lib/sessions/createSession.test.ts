/**
 * Tests for session creation on credit purchase
 * Feature 6 - Task 2.0.1
 *
 * RED Phase: These tests will fail until implementation (Phase 3.0.1)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSession } from '@/lib/sessions/createSession';

describe('createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Audio Session Creation', () => {
    it('should create audio session with status "pending_scheduling"', async () => {
      const userId = 'test-user-123';
      const creditType = 'audio';

      const result = await createSession({
        userId,
        userName: 'Test User',
        userEmail: 'test@example.com',
        type: 'audio',
        creditType,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.type).toBe('audio');
      expect(result.status).toBe('pending_scheduling');
      expect(result.creditDeducted).toBe(true);
      expect(result.creditType).toBe('audio');
      expect(result.relatedSessionId).toBeNull();
      expect(result.scheduledDateTime).toBeNull();
      expect(result.meetingLink).toBeNull();
    });

    it('should create audio session with correct user data (denormalized)', async () => {
      const result = await createSession({
        userId: 'user-123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        type: 'audio',
        creditType: 'audio',
      });

      expect(result.userName).toBe('John Doe');
      expect(result.userEmail).toBe('john@example.com');
    });

    it('should initialize timestamps correctly', async () => {
      const beforeCreate = new Date();

      const result = await createSession({
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        type: 'audio',
        creditType: 'audio',
      });

      const afterCreate = new Date();

      expect(result.createdAt).toBeDefined();
      expect(result.lastActivityAt).toBeDefined();
      expect(result.createdAt.toDate()).toBeInstanceOf(Date);
      expect(result.lastActivityAt.toDate()).toBeInstanceOf(Date);

      // Timestamp should be between before and after
      const createdTime = result.createdAt.toMillis();
      expect(createdTime).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdTime).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should initialize message count and unread to 0', async () => {
      const result = await createSession({
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        type: 'audio',
        creditType: 'audio',
      });

      expect(result.messageCount).toBe(0);
      expect(result.unreadByAdmin).toBe(0);
    });
  });

  describe('Video Session Creation', () => {
    it('should create video session with status "pending_scheduling"', async () => {
      const userId = 'test-user-456';
      const creditType = 'video';

      const result = await createSession({
        userId,
        userName: 'Video User',
        userEmail: 'video@example.com',
        type: 'video',
        creditType,
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('video');
      expect(result.status).toBe('pending_scheduling');
      expect(result.creditType).toBe('video');
    });

    it('should set chatType to null for video sessions', async () => {
      const result = await createSession({
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        type: 'video',
        creditType: 'video',
      });

      expect(result.chatType).toBeNull();
    });
  });

  describe('Credit Deduction', () => {
    it('should mark credit as deducted', async () => {
      const result = await createSession({
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        type: 'audio',
        creditType: 'audio',
      });

      expect(result.creditDeducted).toBe(true);
    });

    it('should store the correct credit type used', async () => {
      const audioSession = await createSession({
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        type: 'audio',
        creditType: 'audio',
      });

      expect(audioSession.creditType).toBe('audio');

      const videoSession = await createSession({
        userId: 'user-456',
        userName: 'Test2',
        userEmail: 'test2@example.com',
        type: 'video',
        creditType: 'video',
      });

      expect(videoSession.creditType).toBe('video');
    });
  });

  describe('Firestore Integration', () => {
    it('should save session to Firestore consultations collection', async () => {
      const result = await createSession({
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        type: 'audio',
        creditType: 'audio',
      });

      // Session should have Firestore-generated ID
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if userId is missing', async () => {
      await expect(
        createSession({
          userId: '',
          userName: 'Test',
          userEmail: 'test@example.com',
          type: 'audio',
          creditType: 'audio',
        })
      ).rejects.toThrow('userId is required');
    });

    it('should throw error if userName is missing', async () => {
      await expect(
        createSession({
          userId: 'user-123',
          userName: '',
          userEmail: 'test@example.com',
          type: 'audio',
          creditType: 'audio',
        })
      ).rejects.toThrow('userName is required');
    });

    it('should throw error if userEmail is missing', async () => {
      await expect(
        createSession({
          userId: 'user-123',
          userName: 'Test',
          userEmail: '',
          type: 'audio',
          creditType: 'audio',
        })
      ).rejects.toThrow('userEmail is required');
    });

    it('should throw error if type is invalid', async () => {
      await expect(
        createSession({
          userId: 'user-123',
          userName: 'Test',
          userEmail: 'test@example.com',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: 'invalid' as any,
          creditType: 'audio',
        })
      ).rejects.toThrow('Invalid session type');
    });
  });
});
