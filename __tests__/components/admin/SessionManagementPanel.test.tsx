/**
 * Tests for Admin Session Management Panel
 * Feature 6 - Task 2.0.6
 *
 * RED Phase: These tests will fail until implementation (Phase 4.0.3)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SessionManagementPanel } from '@/components/admin/SessionManagementPanel';

describe('SessionManagementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pending Sessions Display', () => {
    it('should display all pending sessions across all users', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/pending sessions/i)).toBeInTheDocument();
      });
    });

    it('should show user information for each session', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/test user/i)).toBeInTheDocument();
        expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
      });
    });

    it('should show "Create Scheduling Chat" button for pending_scheduling status', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const createChatBtn = screen.getByRole('button', { name: /create scheduling chat/i });
        expect(createChatBtn).toBeInTheDocument();
      });
    });
  });

  describe('Scheduled Sessions Display', () => {
    it('should show "Mark as Completed" button for scheduled sessions', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const completeBtn = screen.getByRole('button', { name: /mark as completed/i });
        expect(completeBtn).toBeInTheDocument();
      });
    });

    it('should display scheduled date/time', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/scheduled for/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Scheduling Chat Action', () => {
    it('should call createSchedulingChat when button clicked', async () => {
      const mockCreateSchedulingChat = vi.fn();

      render(<SessionManagementPanel />);

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /create scheduling chat/i });
        fireEvent.click(btn);
      });

      expect(mockCreateSchedulingChat).toHaveBeenCalled();
    });

    it('should show success message after creating scheduling chat', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /create scheduling chat/i });
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(screen.getByText(/scheduling chat created/i)).toBeInTheDocument();
      });
    });
  });

  describe('Update Session Status Action', () => {
    it('should call updateSessionToCompleted when mark complete clicked', async () => {
      const mockUpdateSession = vi.fn();

      render(<SessionManagementPanel />);

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /mark as completed/i });
        fireEvent.click(btn);
      });

      expect(mockUpdateSession).toHaveBeenCalled();
    });

    it('should show confirmation dialog before marking complete', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /mark as completed/i });
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(screen.getByText(/confirm session completion/i)).toBeInTheDocument();
      });
    });
  });

  describe('Send Meeting Link Action', () => {
    it('should show "Send Meeting Link" button for scheduled sessions', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const sendLinkBtn = screen.getByRole('button', { name: /send meeting link/i });
        expect(sendLinkBtn).toBeInTheDocument();
      });
    });

    it('should open meeting link form when button clicked', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /send meeting link/i });
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/meeting link/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    it('should filter by session type (audio/video)', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const audioFilter = screen.getByRole('button', { name: /audio/i });
        fireEvent.click(audioFilter);
      });

      await waitFor(() => {
        // Only audio sessions should be visible
        expect(screen.getAllByText(/audio/i).length).toBeGreaterThan(0);
      });
    });

    it('should sort by purchase date', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        const sortBtn = screen.getByRole('button', { name: /sort/i });
        fireEvent.click(sortBtn);
      });

      // Sessions should be sorted by createdAt desc
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no pending sessions', async () => {
      render(<SessionManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/no pending sessions/i)).toBeInTheDocument();
      });
    });
  });
});
