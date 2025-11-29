import { vi } from 'vitest';

/**
 * Mock email service for testing meeting link delivery
 * Used in Feature 6 tests for audio/video session email notifications
 */

/**
 * Mock email data structure
 */
export interface MockEmail {
  to: string;
  subject: string;
  html: string;
  meetingLink?: string;
  sessionType?: 'audio' | 'video';
  scheduledDateTime?: Date;
}

/**
 * In-memory store of sent emails (for test assertions)
 */
export const sentEmails: MockEmail[] = [];

/**
 * Mock sendMeetingLinkEmail function
 * Simulates sending meeting link via Firebase Email Extension or SendGrid
 */
export const mockSendMeetingLinkEmail = vi.fn(
  async (email: MockEmail): Promise<{ success: boolean; messageId?: string }> => {
    // Simulate email delivery
    sentEmails.push(email);

    // Simulate success response
    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
    };
  }
);

/**
 * Mock sendMeetingLinkEmail with error
 * Simulates email delivery failure
 */
export const mockSendMeetingLinkEmailWithError = vi.fn(
  async (): Promise<{ success: boolean; error?: string }> => {
    // Simulate error response
    throw new Error('Failed to send email: SMTP connection error');
  }
);

/**
 * Mock retry logic for email sending
 * Simulates exponential backoff retry mechanism
 */
export const mockSendEmailWithRetry = vi.fn(
  async (
    email: MockEmail,
    maxRetries: number = 3
  ): Promise<{ success: boolean; attempts: number }> => {
    let attempts = 0;

    for (let i = 0; i < maxRetries; i++) {
      attempts++;
      try {
        await mockSendMeetingLinkEmail(email);
        return { success: true, attempts };
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        // Simulate exponential backoff delay
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
      }
    }

    return { success: false, attempts };
  }
);

/**
 * Mock email template renderer
 * Generates HTML content for meeting link email
 */
export const mockRenderMeetingLinkEmailTemplate = vi.fn(
  (params: {
    userName: string;
    sessionType: 'audio' | 'video';
    scheduledDateTime: Date;
    meetingLink: string;
  }): string => {
    return `
      <html>
        <body>
          <h1>Your ${params.sessionType === 'audio' ? 'Audio' : 'Video'} Session is Scheduled!</h1>
          <p>Hello ${params.userName},</p>
          <p>Your consultation session is confirmed for ${params.scheduledDateTime.toLocaleString()}.</p>
          <p><strong>Meeting Link:</strong> <a href="${params.meetingLink}">${params.meetingLink}</a></p>
          <p>Please join the meeting at the scheduled time.</p>
          <p>Thank you!</p>
        </body>
      </html>
    `;
  }
);

/**
 * Reset all email mocks and clear sent emails
 */
export const resetEmailMocks = () => {
  mockSendMeetingLinkEmail.mockClear();
  mockSendMeetingLinkEmailWithError.mockClear();
  mockSendEmailWithRetry.mockClear();
  mockRenderMeetingLinkEmailTemplate.mockClear();
  sentEmails.length = 0; // Clear array
};

/**
 * Helper: Get emails sent to a specific user
 */
export const getEmailsSentTo = (email: string): MockEmail[] => {
  return sentEmails.filter(e => e.to === email);
};

/**
 * Helper: Check if email with meeting link was sent
 */
export const wasEmailSentWithMeetingLink = (meetingLink: string): boolean => {
  return sentEmails.some(e => e.meetingLink === meetingLink);
};

/**
 * Helper: Get last sent email
 */
export const getLastSentEmail = (): MockEmail | undefined => {
  return sentEmails[sentEmails.length - 1];
};
