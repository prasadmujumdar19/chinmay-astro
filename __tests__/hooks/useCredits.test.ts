/**
 * Unit tests for useCredits hook
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCredits } from '@/hooks/useCredits';
import { mockCreditsAll, mockCreditsZero, mockCreditsSome } from '../fixtures/credits';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
}));

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { uid: 'test-user-id' },
  })),
}));

describe('useCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);
    mockOnSnapshot.mockReturnValue(vi.fn()); // unsubscribe

    const { result } = renderHook(() => useCredits());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.credits).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should subscribe to user document credits', () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);
    mockOnSnapshot.mockReturnValue(vi.fn());

    renderHook(() => useCredits());

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id');
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('should return credits data after load', async () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    mockOnSnapshot.mockImplementation((docRef, callback: any) => {
      // Immediately call callback with data
      callback({
        exists: () => true,
        data: () => ({
          uid: 'test-user-id',
          credits: mockCreditsAll,
        }),
      });
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.credits).toEqual(mockCreditsAll);
    expect(result.current.error).toBeNull();
  });

  it('should handle missing credits field (default to zero)', async () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    mockOnSnapshot.mockImplementation((docRef, callback: any) => {
      callback({
        exists: () => true,
        data: () => ({
          uid: 'test-user-id',
          // No credits field
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.credits).toEqual(mockCreditsZero);
  });

  it('should handle Firestore errors', async () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    mockOnSnapshot.mockImplementation((docRef, callback: any, errorCallback: any) => {
      // Immediately call error callback
      errorCallback(new Error('Firestore listener error'));
      return vi.fn();
    });

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.credits).toBeNull();
    expect(result.current.error).toBe('Firestore listener error');
  });

  it('should unsubscribe on unmount', () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const unsubscribe = vi.fn();
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);
    mockOnSnapshot.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useCredits());

    expect(unsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should update credits when Firestore data changes', async () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    let snapshotCallback: any;
    mockOnSnapshot.mockImplementation((docRef, callback: any) => {
      snapshotCallback = callback;
      // Initial data
      callback({
        exists: () => true,
        data: () => ({
          uid: 'test-user-id',
          credits: mockCreditsSome,
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.credits).toEqual(mockCreditsSome);
    });

    // Simulate Firestore update
    snapshotCallback({
      exists: () => true,
      data: () => ({
        uid: 'test-user-id',
        credits: mockCreditsAll,
      }),
    });

    await waitFor(() => {
      expect(result.current.credits).toEqual(mockCreditsAll);
    });
  });

  it('should return null credits when user is not authenticated', () => {
    const { useAuthStore } = vi.mocked(require('@/stores/authStore') as any);
    useAuthStore.mockReturnValue({ user: null });

    const { result } = renderHook(() => useCredits());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.credits).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
