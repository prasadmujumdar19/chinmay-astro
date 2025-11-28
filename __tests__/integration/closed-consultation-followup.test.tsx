import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from '@/components/chat/ChatWindow';
import {
  mockClosedConsultation,
  mockClosedConsultationMessages,
} from '@/__tests__/fixtures/consultations';

// Mock useMessages hook
vi.mock('@/hooks/useMessages', () => ({
  useMessages: vi.fn(() => ({
    messages: [],
    consultation: null,
    loading: true,
    error: null,
    sendMessage: vi.fn(),
    markMessagesAsRead: vi.fn(),
  })),
}));

describe('Closed Consultation Follow-up Flow (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User can add follow-up message to closed consultation', () => {
    it('should display closed notice when consultation is closed', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockClosedConsultationMessages,
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<ChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByText(/consultation closed/i)).toBeInTheDocument();
      expect(screen.getByText(/you can still add follow-up messages/i)).toBeInTheDocument();
    });

    it('should allow user to type message even when closed', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockClosedConsultationMessages,
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<ChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your message/i);

      // Assert
      expect(textarea).not.toBeDisabled();
    });

    it('should allow user to send follow-up message', async () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const mockSendMessage = vi.fn();
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockClosedConsultationMessages,
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<ChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(textarea, 'I have a follow-up question');
      await user.click(sendButton);

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith('I have a follow-up question');
    });

    it('should show follow-up message in conversation', async () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');

      // Initial state: closed consultation with messages
      useMessages.mockReturnValue({
        messages: mockClosedConsultationMessages,
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      const { rerender } = render(<ChatWindow consultationId={consultationId} />);

      // Simulate new follow-up message added
      const followUpMessages = [
        ...mockClosedConsultationMessages,
        {
          id: 'msg-followup-new',
          consultationId: 'consultation-closed-456',
          senderId: 'user-123',
          senderRole: 'user' as const,
          senderName: 'Test User',
          text: 'I have a follow-up question',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          timestamp: { toDate: () => new Date() } as any,
          readByAdmin: false,
          readByUser: true,
          isClosingMessage: false,
          isReopeningMessage: false,
        },
      ];

      useMessages.mockReturnValue({
        messages: followUpMessages,
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      rerender(<ChatWindow consultationId={consultationId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/i have a follow-up question/i)).toBeInTheDocument();
      });
    });

    it('should keep consultation status as closed after follow-up', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');

      const followUpMessages = [
        ...mockClosedConsultationMessages,
        {
          id: 'msg-followup-new',
          consultationId: 'consultation-closed-456',
          senderId: 'user-123',
          senderRole: 'user' as const,
          senderName: 'Test User',
          text: 'I have a follow-up question',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          timestamp: { toDate: () => new Date() } as any,
          readByAdmin: false,
          readByUser: true,
          isClosingMessage: false,
          isReopeningMessage: false,
        },
      ];

      useMessages.mockReturnValue({
        messages: followUpMessages,
        consultation: mockClosedConsultation, // Still closed
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<ChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByText(/consultation closed/i)).toBeInTheDocument();
    });
  });

  describe('Admin response reopens consultation', () => {
    it('should mark consultation as active when admin responds', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');

      const reopenedMessages = [
        ...mockClosedConsultationMessages,
        {
          id: 'msg-admin-reopen',
          consultationId: 'consultation-closed-456',
          senderId: 'admin-456',
          senderRole: 'admin' as const,
          senderName: 'Chinmay Jyotish',
          text: 'Let me answer your follow-up',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          timestamp: { toDate: () => new Date() } as any,
          readByAdmin: true,
          readByUser: false,
          isClosingMessage: false,
          isReopeningMessage: true,
        },
      ];

      useMessages.mockReturnValue({
        messages: reopenedMessages,
        consultation: { ...mockClosedConsultation, status: 'active' as const },
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<ChatWindow consultationId={consultationId} />);

      // Assert
      // Should NOT show closed notice anymore
      expect(screen.queryByText(/consultation closed/i)).not.toBeInTheDocument();
    });

    it('should display reopening message with badge', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');

      const reopenedMessages = [
        ...mockClosedConsultationMessages,
        {
          id: 'msg-admin-reopen',
          consultationId: 'consultation-closed-456',
          senderId: 'admin-456',
          senderRole: 'admin' as const,
          senderName: 'Chinmay Jyotish',
          text: 'Let me answer your follow-up',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          timestamp: { toDate: () => new Date() } as any,
          readByAdmin: true,
          readByUser: false,
          isClosingMessage: false,
          isReopeningMessage: true,
        },
      ];

      useMessages.mockReturnValue({
        messages: reopenedMessages,
        consultation: { ...mockClosedConsultation, status: 'active' as const },
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<ChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByText(/consultation reopened/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error if follow-up message fails to send', async () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const mockSendMessage = vi.fn().mockRejectedValue(new Error('Network error'));
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockClosedConsultationMessages,
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<ChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(textarea, 'Follow-up message');
      await user.click(sendButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to send|error/i)).toBeInTheDocument();
      });
    });
  });
});
