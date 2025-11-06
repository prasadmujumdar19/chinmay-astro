/**
 * Unit tests for CreditsCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditsCard } from '@/components/dashboard/CreditsCard';
import { mockCreditsAll, mockCreditsZero, mockCreditsSome } from '../../fixtures/credits';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MessageSquare: () => <div data-testid="icon-chat">Chat Icon</div>,
  Mic: () => <div data-testid="icon-audio">Audio Icon</div>,
  Video: () => <div data-testid="icon-video">Video Icon</div>,
  ShoppingCart: () => <div data-testid="icon-cart">Cart Icon</div>,
}));

describe('CreditsCard', () => {
  it('should render three credit types (chat, audio, video)', () => {
    render(<CreditsCard credits={mockCreditsAll} />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('should show correct credit counts', () => {
    render(<CreditsCard credits={mockCreditsAll} />);

    // mockCreditsAll: { chat: 5, audio: 2, video: 3 }
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display appropriate icons for each credit type', () => {
    render(<CreditsCard credits={mockCreditsAll} />);

    expect(screen.getByTestId('icon-chat')).toBeInTheDocument();
    expect(screen.getByTestId('icon-audio')).toBeInTheDocument();
    expect(screen.getByTestId('icon-video')).toBeInTheDocument();
  });

  it('should display "Buy More" button', () => {
    render(<CreditsCard credits={mockCreditsAll} />);

    const buyButton = screen.getByRole('link', { name: /buy more/i });
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).toHaveAttribute('href', '/purchase');
  });

  it('should show zero-credit warning when all credits are 0', () => {
    render(<CreditsCard credits={mockCreditsZero} />);

    expect(screen.getByText(/no credits available/i)).toBeInTheDocument();
  });

  it('should not show zero-credit warning when user has any credits', () => {
    render(<CreditsCard credits={mockCreditsSome} />);

    expect(screen.queryByText(/no credits available/i)).not.toBeInTheDocument();
  });

  it('should display zero for credit types with no balance', () => {
    render(<CreditsCard credits={mockCreditsSome} />);

    // mockCreditsSome: { chat: 3, audio: 0, video: 1 }
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<CreditsCard credits={mockCreditsAll} />);

    const card = screen.getByRole('region', { name: /credits/i });
    expect(card).toBeInTheDocument();
  });

  it('should apply correct styling classes for each credit type', () => {
    const { container } = render(<CreditsCard credits={mockCreditsAll} />);

    // Should have distinct color classes for each type
    expect(container.querySelector('[class*="blue"]')).toBeInTheDocument(); // Chat (blue)
    expect(container.querySelector('[class*="green"]')).toBeInTheDocument(); // Audio (green)
    expect(container.querySelector('[class*="purple"]')).toBeInTheDocument(); // Video (purple)
  });
});
