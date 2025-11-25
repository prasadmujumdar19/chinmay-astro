/**
 * Tests for Sessions page (user view)
 * Feature 6 - Task 2.0.5
 *
 * RED Phase: These tests will fail until implementation (Phase 4.0.2)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionsPage } from '@/components/sessions/SessionsPage';

describe('SessionsPage', () => {
  beforeEach(() => {
    // Clear mocks
  });

  describe('Sessions List Rendering', () => {
    it('should render sessions list', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my sessions/i })).toBeInTheDocument();
      });
    });

    it('should display session type badge (audio/video)', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/audio/i)).toBeInTheDocument();
      });
    });

    it('should display session status badge', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/pending scheduling/i)).toBeInTheDocument();
      });
    });

    it('should show purchase date for each session', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/purchased/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Display', () => {
    it('should show "Pending Scheduling" for pending_scheduling status', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/pending scheduling/i)).toBeInTheDocument();
      });
    });

    it('should show scheduled date/time for scheduled status', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        // Should display scheduled datetime
        expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      });
    });

    it('should show completion date for completed status', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no sessions', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
      });
    });

    it('should show link to purchase page in empty state', async () => {
      render(<SessionsPage userId="test-user-123" />);

      await waitFor(() => {
        const purchaseLink = screen.getByRole('link', { name: /purchase credits/i });
        expect(purchaseLink).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching sessions', async () => {
      render(<SessionsPage userId="test-user-123" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});
