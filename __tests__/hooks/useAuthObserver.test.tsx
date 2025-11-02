import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { mockRegularUser, mockFirebaseUserRegular } from '../fixtures/auth';

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

vi.mock('@/lib/firebase/auth', () => ({
  auth: { currentUser: null },
}));

vi.mock('@/lib/firebase/users', () => ({
  getUserProfile: vi.fn(),
}));

// Import after mocks are set up
import { useAuthObserver } from '@/hooks/useAuthObserver';
import { useAuthStore } from '@/stores/authStore';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '@/lib/firebase/users';
import { auth } from '@/lib/firebase/auth';

describe('useAuthObserver Hook', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setLoading(true);

    // Create a fresh unsubscribe mock for each test
    unsubscribeMock = vi.fn();
    (onAuthStateChanged as ReturnType<typeof vi.fn>).mockReturnValue(unsubscribeMock);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call onAuthStateChanged on mount', () => {
    // Render the hook
    renderHook(() => useAuthObserver());

    // Verify onAuthStateChanged was called
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
  });

  it('should fetch user profile from Firestore when auth state changes', async () => {
    (getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockRegularUser);

    // Render hook and capture the callback
    renderHook(() => useAuthObserver());

    // Get the callback that was passed to onAuthStateChanged
    const authStateCallback = (onAuthStateChanged as ReturnType<typeof vi.fn>).mock.calls[0][1];

    // Simulate Firebase auth state change with a user
    await authStateCallback(mockFirebaseUserRegular as User);

    // Verify getUserProfile was called with the correct uid
    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalledWith(mockFirebaseUserRegular.uid);
    });
  });

  it('should update Zustand store with fetched user profile', async () => {
    (getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockRegularUser);

    // Render hook
    renderHook(() => useAuthObserver());

    // Get the callback
    const authStateCallback = (onAuthStateChanged as ReturnType<typeof vi.fn>).mock.calls[0][1];

    // Simulate auth state change
    await authStateCallback(mockFirebaseUserRegular as User);

    // Verify store was updated with user profile
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockRegularUser);
    });
  });

  it('should set loading to false after initialization', async () => {
    (getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockRegularUser);

    // Store should start with loading: true
    expect(useAuthStore.getState().loading).toBe(true);

    // Render hook
    renderHook(() => useAuthObserver());

    // Get the callback
    const authStateCallback = (onAuthStateChanged as ReturnType<typeof vi.fn>).mock.calls[0][1];

    // Simulate auth state change
    await authStateCallback(mockFirebaseUserRegular as User);

    // Verify loading is false after user profile is fetched
    await waitFor(() => {
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  it('should handle sign-out (set user to null in store)', async () => {
    // First, set a user in the store
    useAuthStore.getState().setUser(mockRegularUser);
    expect(useAuthStore.getState().user).toEqual(mockRegularUser);

    // Render hook
    renderHook(() => useAuthObserver());

    // Get the callback
    const authStateCallback = (onAuthStateChanged as ReturnType<typeof vi.fn>).mock.calls[0][1];

    // Simulate sign-out (null user)
    await authStateCallback(null);

    // Verify store was cleared
    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  it('should unsubscribe from listener on unmount', () => {
    // Render hook
    const { unmount } = renderHook(() => useAuthObserver());

    // Verify unsubscribe was not called yet
    expect(unsubscribeMock).not.toHaveBeenCalled();

    // Unmount the hook
    unmount();

    // Verify unsubscribe was called
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
