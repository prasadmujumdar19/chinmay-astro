/**
 * Tests for scheduling chat creation (admin function)
 * Feature 6 - Task 2.0.2
 *
 * RED Phase: These tests will fail until implementation (Phase 3.0.2)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSchedulingChat } from '@/lib/sessions/createSchedulingChat';

describe('createSchedulingChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scheduling Chat Creation', () => {
    it('should create scheduling chat with chatType "scheduling"', async () => {
      const sessionId = 'session_audio_001';
      const userId = 'test-user-123';

      const result = await createSchedulingChat({
        sessionId,
        userId,
        userName: 'Test User',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.type).toBe('chat');
      expect(result.chatType).toBe('scheduling');
      expect(result.status).toBe('active');
    });

    it('should link scheduling chat to session via relatedSessionId', async () => {
      const sessionId = 'session_audio_001';

      const result = await createSchedulingChat({
        sessionId,
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(result.relatedSessionId).toBe(sessionId);
    });

    it('should set thread title based on session type', async () => {
      const audioResult = await createSchedulingChat({
        sessionId: 'session_audio_001',
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(audioResult.threadTitle).toBe('Audio Session Scheduling');

      const videoResult = await createSchedulingChat({
        sessionId: 'session_video_001',
        userId: 'user-456',
        userName: 'Test2',
        userEmail: 'test2@example.com',
        sessionType: 'video',
      });

      expect(videoResult.threadTitle).toBe('Video Session Scheduling');
    });

    it('should NOT deduct credit for scheduling chat', async () => {
      const result = await createSchedulingChat({
        sessionId: 'session_audio_001',
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(result.creditDeducted).toBe(false);
    });

    it('should set creditType to match session type', async () => {
      const audioResult = await createSchedulingChat({
        sessionId: 'session_audio_001',
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(audioResult.creditType).toBe('audio');

      const videoResult = await createSchedulingChat({
        sessionId: 'session_video_001',
        userId: 'user-456',
        userName: 'Test2',
        userEmail: 'test2@example.com',
        sessionType: 'video',
      });

      expect(videoResult.creditType).toBe('video');
    });

    it('should initialize timestamps correctly', async () => {
      const beforeCreate = new Date();

      const result = await createSchedulingChat({
        sessionId: 'session_audio_001',
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      const afterCreate = new Date();

      expect(result.createdAt).toBeDefined();
      expect(result.lastActivityAt).toBeDefined();
      const createdTime = result.createdAt.toMillis();
      expect(createdTime).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdTime).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should set threadNumber to null for scheduling chats', async () => {
      const result = await createSchedulingChat({
        sessionId: 'session_audio_001',
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(result.threadNumber).toBeNull();
    });
  });

  describe('Bidirectional Linking', () => {
    it('should update session relatedSessionId to point to chat', async () => {
      const sessionId = 'session_audio_001';

      const result = await createSchedulingChat({
        sessionId,
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      // This test will verify that the session document is updated
      // to link back to the scheduling chat (bidirectional)
      expect(result.relatedSessionId).toBe(sessionId);

      // The function should also update the session document
      // We'll verify this in integration tests
    });
  });

  describe('User Notification', () => {
    it('should trigger notification to user about scheduling conversation', async () => {
      // This will be tested via Cloud Function trigger
      // For now, just verify chat creation succeeds
      const result = await createSchedulingChat({
        sessionId: 'session_audio_001',
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('active');
    });
  });

  describe('Error Handling', () => {
    it('should throw error if sessionId is missing', async () => {
      await expect(
        createSchedulingChat({
          sessionId: '',
          userId: 'user-123',
          userName: 'Test',
          userEmail: 'test@example.com',
          sessionType: 'audio',
        })
      ).rejects.toThrow('sessionId is required');
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        createSchedulingChat({
          sessionId: 'session_audio_001',
          userId: '',
          userName: 'Test',
          userEmail: 'test@example.com',
          sessionType: 'audio',
        })
      ).rejects.toThrow('userId is required');
    });

    it('should throw error if session does not exist', async () => {
      await expect(
        createSchedulingChat({
          sessionId: 'non-existent-session',
          userId: 'user-123',
          userName: 'Test',
          userEmail: 'test@example.com',
          sessionType: 'audio',
        })
      ).rejects.toThrow('Session not found');
    });

    it('should throw error if session already has scheduling chat', async () => {
      // If session.relatedSessionId is not null, it already has a scheduling chat
      await expect(
        createSchedulingChat({
          sessionId: 'session-with-existing-chat',
          userId: 'user-123',
          userName: 'Test',
          userEmail: 'test@example.com',
          sessionType: 'audio',
        })
      ).rejects.toThrow('Session already has a scheduling chat');
    });

    it('should throw error if session status is not "pending_scheduling"', async () => {
      await expect(
        createSchedulingChat({
          sessionId: 'session-already-scheduled',
          userId: 'user-123',
          userName: 'Test',
          userEmail: 'test@example.com',
          sessionType: 'audio',
        })
      ).rejects.toThrow('Can only create scheduling chat for pending sessions');
    });
  });

  describe('Firestore Integration', () => {
    it('should save scheduling chat to Firestore consultations collection', async () => {
      const result = await createSchedulingChat({
        sessionId: 'session_audio_001',
        userId: 'user-123',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
      });

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });
});
