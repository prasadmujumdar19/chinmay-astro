import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInWithGoogle, signOutUser } from '@/lib/firebase/auth';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { useAuthStore } from '@/stores/authStore';

// Mock Firebase auth functions
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    getAuth: vi.fn(() => ({ currentUser: null })),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: vi.fn(),
  };
});

// Mock Zustand store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      clearAuth: vi.fn(),
    })),
  },
}));

describe('Firebase Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Google Sign-In', () => {
    it('should call signInWithPopup with GoogleAuthProvider', async () => {
      const mockCredential = {
        user: { uid: 'test-123', email: 'test@example.com' },
      };
      vi.mocked(signInWithPopup).mockResolvedValue(mockCredential as any);

      await signInWithGoogle();

      expect(signInWithPopup).toHaveBeenCalledTimes(1);
      // Verify it was called with auth instance and provider
      const callArgs = vi.mocked(signInWithPopup).mock.calls[0];
      expect(callArgs).toHaveLength(2);
    });

    it('should return UserCredential on success', async () => {
      const mockCredential = {
        user: { uid: 'test-123', email: 'test@example.com' },
        providerId: 'google.com',
      };
      vi.mocked(signInWithPopup).mockResolvedValue(mockCredential as any);

      const result = await signInWithGoogle();

      expect(result).toEqual(mockCredential);
    });

    it('should throw error with user-friendly message on popup closed', async () => {
      const error = { code: 'auth/popup-closed-by-user' };
      vi.mocked(signInWithPopup).mockRejectedValue(error);

      await expect(signInWithGoogle()).rejects.toThrow('Sign-in cancelled');
    });

    it('should throw error with user-friendly message on popup blocked', async () => {
      const error = { code: 'auth/popup-blocked' };
      vi.mocked(signInWithPopup).mockRejectedValue(error);

      await expect(signInWithGoogle()).rejects.toThrow('Popup blocked by browser');
    });

    it('should throw error on auth/network errors', async () => {
      const error = { code: 'auth/network-request-failed' };
      vi.mocked(signInWithPopup).mockRejectedValue(error);

      await expect(signInWithGoogle()).rejects.toThrow('Network error');
    });
  });

  describe('Sign-out', () => {
    it('should call Firebase signOut function', async () => {
      vi.mocked(firebaseSignOut).mockResolvedValue();

      await signOutUser();

      expect(firebaseSignOut).toHaveBeenCalledTimes(1);
    });

    it('should clear auth state in Zustand store', async () => {
      const mockClearAuth = vi.fn();
      vi.mocked(useAuthStore.getState).mockReturnValue({
        clearAuth: mockClearAuth,
      } as any);
      vi.mocked(firebaseSignOut).mockResolvedValue();

      await signOutUser();

      expect(mockClearAuth).toHaveBeenCalledTimes(1);
    });
  });
});
