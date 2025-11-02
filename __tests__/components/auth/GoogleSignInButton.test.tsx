import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

// Mock signInWithGoogle
vi.mock('@/lib/firebase/auth', () => ({
  signInWithGoogle: vi.fn(),
}));

// Import after mocks
import { signInWithGoogle } from '@/lib/firebase/auth';

describe('GoogleSignInButton Component', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (signInWithGoogle as ReturnType<typeof vi.fn>).mockClear();
  });

  it('should render button with "Sign in with Google" text', () => {
    render(<GoogleSignInButton />);

    const button = screen.getByRole('button', { name: /sign in with google/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Sign in with Google');
  });

  it('should call signInWithGoogle on click', async () => {
    const mockUserCredential = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    };
    (signInWithGoogle as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserCredential);

    render(<GoogleSignInButton />);

    const button = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it('should show loading state during sign-in', async () => {
    // Create a promise we can control
    let resolveSignIn: ((value: unknown) => void) | undefined;
    const signInPromise = new Promise(resolve => {
      resolveSignIn = resolve;
    });
    (signInWithGoogle as ReturnType<typeof vi.fn>).mockReturnValue(signInPromise);

    render(<GoogleSignInButton />);

    const button = screen.getByRole('button', { name: /sign in with google/i });

    // Before clicking, should show normal text
    expect(button).toHaveTextContent('Sign in with Google');
    expect(button).not.toBeDisabled();

    // Click the button
    fireEvent.click(button);

    // During sign-in, should show loading state
    await waitFor(() => {
      expect(button).toHaveTextContent('Signing in...');
      expect(button).toBeDisabled();
    });

    // Resolve the sign-in
    resolveSignIn!({
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    });

    // After sign-in completes, should return to normal state
    await waitFor(() => {
      expect(button).toHaveTextContent('Sign in with Google');
      expect(button).not.toBeDisabled();
    });
  });

  it('should call onSuccess callback with user on successful sign-in', async () => {
    const mockUserCredential = {
      user: {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    };
    (signInWithGoogle as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserCredential);

    render(<GoogleSignInButton onSuccess={mockOnSuccess} />);

    const button = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'test-uid-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        })
      );
    });
  });

  it('should call onError callback with error message on failure', async () => {
    const errorMessage = 'Sign-in failed';
    (signInWithGoogle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error(errorMessage));

    render(<GoogleSignInButton onError={mockOnError} />);

    const button = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should display error message in UI on failure', async () => {
    const errorMessage = 'Sign-in failed';
    (signInWithGoogle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error(errorMessage));

    render(<GoogleSignInButton />);

    const button = screen.getByRole('button', { name: /sign in with google/i });

    // No error initially
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Click to trigger sign-in
    fireEvent.click(button);

    // Error should be displayed
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });
  });
});
