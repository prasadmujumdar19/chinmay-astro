/**
 * Unit tests for PurchasePrompt component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PurchasePrompt } from '@/components/dashboard/PurchasePrompt';
import { mockCreditsZero, mockCreditsSome, mockCreditsAll } from '../../fixtures/credits';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PurchasePrompt', () => {
  it('should show when credits are zero', () => {
    render(<PurchasePrompt credits={mockCreditsZero} />);

    expect(screen.getByText(/no credits available/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /purchase.*credits/i })).toBeInTheDocument();
  });

  it('should hide when user has any credits', () => {
    const { container } = render(<PurchasePrompt credits={mockCreditsSome} />);

    expect(container.firstChild).toBeNull();
  });

  it('should hide when user has all credit types', () => {
    const { container } = render(<PurchasePrompt credits={mockCreditsAll} />);

    expect(container.firstChild).toBeNull();
  });

  it('should link to /purchase page', () => {
    render(<PurchasePrompt credits={mockCreditsZero} />);

    const link = screen.getByRole('link', { name: /purchase.*credits/i });
    expect(link).toHaveAttribute('href', '/purchase');
  });

  it('should display warning icon or indicator', () => {
    render(<PurchasePrompt credits={mockCreditsZero} />);

    // Check for warning/alert styling or icon
    const prompt = screen.getByText(/no credits available/i).closest('div');
    expect(prompt).toHaveClass(/warning|alert|yellow|amber/i);
  });

  it('should have proper accessibility attributes', () => {
    render(<PurchasePrompt credits={mockCreditsZero} />);

    const prompt = screen.getByRole('alert');
    expect(prompt).toBeInTheDocument();
  });

  it('should show only when ALL credit types are zero', () => {
    // Even if one credit type has balance, should not show
    const oneCredit = { chat: 1, audio: 0, video: 0 };
    const { container } = render(<PurchasePrompt credits={oneCredit} />);

    expect(container.firstChild).toBeNull();
  });
});
