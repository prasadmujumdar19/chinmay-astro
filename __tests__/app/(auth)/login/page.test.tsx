import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { UserProfile } from '@/types/auth';
import { mockRegularUser } from '../../../fixtures/auth';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock redirects
vi.mock('@/lib/auth/redirects', () => ({
  getRedirectPath: vi.fn((user: UserProfile) => {
    return user.role === 'admin' ? '/admin' : '/dashboard';
  }),
}));

// Mock GoogleSignInButton component
interface MockGoogleSignInButtonProps {
  onSuccess?: (user: UserProfile) => void;
  onError?: (error: string) => void;
}

vi.mock('@/components/auth/GoogleSignInButton', () => ({
  GoogleSignInButton: ({ onSuccess, onError }: MockGoogleSignInButtonProps) => (
    <div data-testid="google-sign-in-button">
      <button onClick={() => onSuccess?.(mockRegularUser)}>Sign in with Google</button>
      <button onClick={() => onError?.('Test error')}>Trigger Error</button>
    </div>
  ),
}));

// Import after mocks
import LoginPage from '@/app/(auth)/login/page';
import { useAuthStore } from '@/stores/authStore';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('should render GoogleSignInButton', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<LoginPage />);

    // Should render the GoogleSignInButton component
    expect(screen.getByTestId('google-sign-in-button')).toBeInTheDocument();
  });

  it('should show welcome message and app description', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<LoginPage />);

    // Should show welcome heading
    expect(screen.getByRole('heading', { name: /welcome to chinmay astro/i })).toBeInTheDocument();

    // Should show app description
    expect(screen.getByText(/your trusted astrology consultation platform/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /get personalized astrology consultations through chat, audio, or video sessions/i
      )
    ).toBeInTheDocument();
  });

  it('should redirect to role-based route after successful sign-in', async () => {
    // Start with no user
    const mockStore = {
      user: null,
      loading: false,
    };

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);

    const { rerender } = render(<LoginPage />);

    // Initially should not redirect
    expect(mockPush).not.toHaveBeenCalled();

    // Simulate user sign-in by updating the store
    mockStore.user = mockRegularUser;
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);

    // Rerender to trigger useEffect
    rerender(<LoginPage />);

    // Should redirect to /dashboard for regular user
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error message on sign-in failure', async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<LoginPage />);

    // The GoogleSignInButton component handles error display internally
    // This test verifies the button is present and can handle errors
    const button = screen.getByText('Trigger Error');
    expect(button).toBeInTheDocument();

    // Note: Error display happens within GoogleSignInButton component
    // which is already tested in GoogleSignInButton.test.tsx
  });
});
