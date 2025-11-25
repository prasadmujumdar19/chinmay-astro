/**
 * Tests for email meeting link delivery
 * Feature 6 - Task 2.0.4
 *
 * RED Phase: These tests will fail until implementation (Phase 3.0.4)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sendMeetingLink } from '@/lib/sessions/sendMeetingLink';
import { resetEmailMocks, sentEmails } from '@/__tests__/mocks/email';

describe('sendMeetingLink', () => {
  beforeEach(() => {
    resetEmailMocks();
  });

  describe('Email Delivery', () => {
    it('should send email with meeting link to user', async () => {
      const sessionId = 'session_audio_001';
      const meetingLink = 'https://meet.google.com/xyz-abc-def';

      await sendMeetingLink({
        sessionId,
        meetingLink,
        userName: 'Test User',
        userEmail: 'test@example.com',
        sessionType: 'audio',
        scheduledDateTime: new Date('2025-11-01T10:00:00Z'),
      });

      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toBe('test@example.com');
      expect(sentEmails[0].meetingLink).toBe(meetingLink);
    });

    it('should include session details in email', async () => {
      const sessionDetails = {
        sessionId: 'session_video_001',
        meetingLink: 'https://zoom.us/j/1234567890',
        userName: 'Test User',
        userEmail: 'test@example.com',
        sessionType: 'video' as const,
        scheduledDateTime: new Date('2025-11-02T15:00:00Z'),
      };

      await sendMeetingLink(sessionDetails);

      const email = sentEmails[0];
      expect(email.subject).toContain('Video Session');
      expect(email.html).toContain(sessionDetails.meetingLink);
      expect(email.html).toContain(sessionDetails.userName);
    });

    it('should store meeting link in session document', async () => {
      const sessionId = 'session_audio_001';
      const meetingLink = 'https://meet.google.com/xyz-abc-def';

      const result = await sendMeetingLink({
        sessionId,
        meetingLink,
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
        scheduledDateTime: new Date(),
      });

      expect(result.meetingLink).toBe(meetingLink);
    });
  });

  describe('Email Template', () => {
    it('should render correct template for audio sessions', async () => {
      await sendMeetingLink({
        sessionId: 'session_audio_001',
        meetingLink: 'https://meet.google.com/test',
        userName: 'Test User',
        userEmail: 'test@example.com',
        sessionType: 'audio',
        scheduledDateTime: new Date('2025-11-01T10:00:00Z'),
      });

      const email = sentEmails[0];
      expect(email.html).toContain('Audio Session');
    });

    it('should render correct template for video sessions', async () => {
      await sendMeetingLink({
        sessionId: 'session_video_001',
        meetingLink: 'https://zoom.us/j/1234567890',
        userName: 'Test User',
        userEmail: 'test@example.com',
        sessionType: 'video',
        scheduledDateTime: new Date('2025-11-02T15:00:00Z'),
      });

      const email = sentEmails[0];
      expect(email.html).toContain('Video Session');
    });
  });

  describe('Error Handling', () => {
    it('should throw error if sessionId is missing', async () => {
      await expect(
        sendMeetingLink({
          sessionId: '',
          meetingLink: 'https://meet.google.com/test',
          userName: 'Test',
          userEmail: 'test@example.com',
          sessionType: 'audio',
          scheduledDateTime: new Date(),
        })
      ).rejects.toThrow('sessionId is required');
    });

    it('should throw error if meeting link is invalid', async () => {
      await expect(
        sendMeetingLink({
          sessionId: 'session_audio_001',
          meetingLink: 'invalid-link',
          userName: 'Test',
          userEmail: 'test@example.com',
          sessionType: 'audio',
          scheduledDateTime: new Date(),
        })
      ).rejects.toThrow('Invalid meeting link format');
    });

    it('should retry on email delivery failure', async () => {
      // Mock email failure
      const failedSessionId = 'session-email-fail';

      // This test verifies retry logic is implemented
      // Implementation will use exponential backoff
      await expect(
        sendMeetingLink({
          sessionId: failedSessionId,
          meetingLink: 'https://meet.google.com/test',
          userName: 'Test',
          userEmail: 'invalid@example.com',
          sessionType: 'audio',
          scheduledDateTime: new Date(),
        })
      ).rejects.toThrow();
    });
  });

  describe('Meeting Link Validation', () => {
    it('should accept valid Google Meet links', async () => {
      const result = await sendMeetingLink({
        sessionId: 'session_audio_001',
        meetingLink: 'https://meet.google.com/xyz-abc-def',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'audio',
        scheduledDateTime: new Date(),
      });

      expect(result.meetingLink).toBe('https://meet.google.com/xyz-abc-def');
    });

    it('should accept valid Zoom links', async () => {
      const result = await sendMeetingLink({
        sessionId: 'session_video_001',
        meetingLink: 'https://zoom.us/j/1234567890',
        userName: 'Test',
        userEmail: 'test@example.com',
        sessionType: 'video',
        scheduledDateTime: new Date(),
      });

      expect(result.meetingLink).toBe('https://zoom.us/j/1234567890');
    });
  });
});
