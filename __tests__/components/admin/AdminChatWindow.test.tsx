import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminChatWindow } from '@/components/admin/AdminChatWindow';
import {
  mockActiveConsultation,
  mockClosedConsultation,
  mockActiveConsultationMessages,
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

// Mock Firebase functions for closeConsultation
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn()),
}));

describe('AdminChatWindow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Layout', () => {
    it('should render messages and input area', () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument();
      expect(screen.getByText(/what does my birth chart say/i)).toBeInTheDocument();
    });

    it('should display consultation thread title', () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByText(/consultation #1/i)).toBeInTheDocument();
    });

    it('should display user information in header', () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
    });
  });

  describe('Send Button (Active Consultation)', () => {
    it('should render Send button when consultation is active', () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByRole('button', { name: /^send$/i })).toBeInTheDocument();
    });

    it('should call sendMessage when Send button clicked', async () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const mockSendMessage = vi.fn();
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: mockSendMessage,
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your response/i);
      const sendButton = screen.getByRole('button', { name: /^send$/i });

      await user.type(textarea, 'Admin response');
      await user.click(sendButton);

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith('Admin response');
    });

    it('should clear textarea after sending message', async () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your response/i) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /^send$/i });

      await user.type(textarea, 'Admin response');
      await user.click(sendButton);

      // Assert
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });
  });

  describe('Send & Close Button (Active Consultation)', () => {
    it('should render Send & Close button when consultation is active', () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByRole('button', { name: /send & close/i })).toBeInTheDocument();
    });

    it('should call closeConsultation Cloud Function with message when Send & Close clicked', async () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const mockCloseConsultation = vi.fn().mockResolvedValue({ data: { success: true } });
      const { httpsCallable } = require('firebase/functions');
      httpsCallable.mockReturnValue(mockCloseConsultation);

      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your response/i);
      const sendCloseButton = screen.getByRole('button', { name: /send & close/i });

      await user.type(textarea, 'Final response. Closing now.');
      await user.click(sendCloseButton);

      // Assert
      await waitFor(() => {
        expect(mockCloseConsultation).toHaveBeenCalledWith({
          consultationId: 'consultation-active-123',
          closingMessage: 'Final response. Closing now.',
        });
      });
    });

    it('should clear textarea after Send & Close', async () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const mockCloseConsultation = vi.fn().mockResolvedValue({ data: { success: true } });
      const { httpsCallable } = require('firebase/functions');
      httpsCallable.mockReturnValue(mockCloseConsultation);

      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your response/i) as HTMLTextAreaElement;
      const sendCloseButton = screen.getByRole('button', { name: /send & close/i });

      await user.type(textarea, 'Closing message');
      await user.click(sendCloseButton);

      // Assert
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should show confirmation dialog before closing consultation', async () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your response/i);
      const sendCloseButton = screen.getByRole('button', { name: /send & close/i });

      await user.type(textarea, 'Closing message');
      await user.click(sendCloseButton);

      // Assert
      expect(screen.getByText(/are you sure you want to close/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should display error message if closeConsultation fails', async () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const mockCloseConsultation = vi.fn().mockRejectedValue(new Error('Failed to close'));
      const { httpsCallable } = require('firebase/functions');
      httpsCallable.mockReturnValue(mockCloseConsultation);

      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages,
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);
      const textarea = screen.getByPlaceholderText(/type your response/i);
      const sendCloseButton = screen.getByRole('button', { name: /send & close/i });

      await user.type(textarea, 'Closing message');
      await user.click(sendCloseButton);
      // Confirm in dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to close|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Disabled State (Closed Consultation)', () => {
    it('should disable textarea when consultation is closed', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: [],
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      const textarea = screen.getByPlaceholderText(/type your response/i);
      expect(textarea).toBeDisabled();
    });

    it('should disable Send button when consultation is closed', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: [],
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      const sendButton = screen.getByRole('button', { name: /^send$/i });
      expect(sendButton).toBeDisabled();
    });

    it('should disable Send & Close button when consultation is closed', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: [],
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      const sendCloseButton = screen.getByRole('button', { name: /send & close/i });
      expect(sendCloseButton).toBeDisabled();
    });

    it('should display "Consultation Closed" notice', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: [],
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByText(/consultation closed/i)).toBeInTheDocument();
    });
  });

  describe('Reopening Closed Consultation', () => {
    it('should display Reopen button when consultation is closed and has follow-up messages', () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: [
          {
            id: 'msg-followup',
            consultationId: 'consultation-closed-456',
            senderId: 'user-123',
            senderRole: 'user',
            senderName: 'Test User',
            text: 'Follow-up question',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            timestamp: { toDate: () => new Date() } as any,
            readByAdmin: false,
            readByUser: true,
            isClosingMessage: false,
            isReopeningMessage: false,
          },
        ],
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByRole('button', { name: /reopen/i })).toBeInTheDocument();
    });

    it('should reopen consultation when Reopen button clicked', async () => {
      // Arrange
      const consultationId = 'consultation-closed-456';
      const mockUpdateStatus = vi.fn().mockResolvedValue(undefined);
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: [
          {
            id: 'msg-followup',
            consultationId: 'consultation-closed-456',
            senderId: 'user-123',
            senderRole: 'user',
            senderName: 'Test User',
            text: 'Follow-up question',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            timestamp: { toDate: () => new Date() } as any,
            readByAdmin: false,
            readByUser: true,
            isClosingMessage: false,
            isReopeningMessage: false,
          },
        ],
        consultation: mockClosedConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });
      const user = userEvent.setup();

      // Mock updateConsultationStatus
      vi.mock('@/lib/firestore/consultations', () => ({
        updateConsultationStatus: mockUpdateStatus,
      }));

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);
      const reopenButton = screen.getByRole('button', { name: /reopen/i });
      await user.click(reopenButton);

      // Assert
      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalledWith('consultation-closed-456', 'active');
      });
    });
  });

  describe('Unread Message Count', () => {
    it('should display unread message count badge', () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: [
          { ...mockActiveConsultationMessages[0], readByAdmin: false },
          { ...mockActiveConsultationMessages[1], readByAdmin: false },
          { ...mockActiveConsultationMessages[2], readByAdmin: false },
        ],
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.getByText(/3 unread/i)).toBeInTheDocument();
    });

    it('should hide unread badge when all messages are read', () => {
      // Arrange
      const consultationId = 'consultation-active-123';
      const { useMessages } = require('@/hooks/useMessages');
      useMessages.mockReturnValue({
        messages: mockActiveConsultationMessages.map(m => ({ ...m, readByAdmin: true })),
        consultation: mockActiveConsultation,
        loading: false,
        error: null,
        sendMessage: vi.fn(),
        markMessagesAsRead: vi.fn(),
      });

      // Act
      // This will fail - component doesn't exist yet
      render(<AdminChatWindow consultationId={consultationId} />);

      // Assert
      expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
    });
  });
});
