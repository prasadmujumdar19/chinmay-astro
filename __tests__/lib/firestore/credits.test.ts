/**
 * Unit tests for Firestore credit operations
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserCredits, subscribeToCredits } from '@/lib/firestore/credits';
import { mockCreditsAll, mockCreditsZero } from '../../fixtures/credits';
import {
  expectCreditsEqual,
  expectAllCreditsZero,
  expectValidCreditsStructure,
} from '../../utils/credit-assertions';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('getUserCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read credits from user document', async () => {
    const { getDoc, doc } = await import('firebase/firestore');
    const mockDoc = vi.mocked(doc);
    const mockGetDoc = vi.mocked(getDoc);

    // Mock document reference
    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    // Mock document snapshot with credits
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'test-user-id',
        email: 'test@example.com',
        credits: mockCreditsAll,
      }),
    } as any);

    const credits = await getUserCredits('test-user-id');

    expect(credits).toBeDefined();
    expectValidCreditsStructure(credits);
    expectCreditsEqual(credits, mockCreditsAll);
  });

  it('should handle missing credits field (default to zero)', async () => {
    const { getDoc, doc } = await import('firebase/firestore');
    const mockDoc = vi.mocked(doc);
    const mockGetDoc = vi.mocked(getDoc);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    // Mock document snapshot without credits field
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'test-user-id',
        email: 'test@example.com',
        // No credits field
      }),
    } as any);

    const credits = await getUserCredits('test-user-id');

    expect(credits).toBeDefined();
    expectAllCreditsZero(credits);
  });

  it('should handle non-existent user document', async () => {
    const { getDoc, doc } = await import('firebase/firestore');
    const mockDoc = vi.mocked(doc);
    const mockGetDoc = vi.mocked(getDoc);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    // Mock non-existent document
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    } as any);

    await expect(getUserCredits('test-user-id')).rejects.toThrow('User not found');
  });

  it('should handle Firestore errors gracefully', async () => {
    const { getDoc, doc } = await import('firebase/firestore');
    const mockDoc = vi.mocked(doc);
    const mockGetDoc = vi.mocked(getDoc);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);
    mockGetDoc.mockRejectedValue(new Error('Firestore connection error'));

    await expect(getUserCredits('test-user-id')).rejects.toThrow('Firestore connection error');
  });
});

describe('subscribeToCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to user document credits', () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    const callback = vi.fn();
    const unsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(unsubscribe);

    const result = subscribeToCredits('test-user-id', callback);

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id');
    expect(mockOnSnapshot).toHaveBeenCalled();
    expect(result).toBe(unsubscribe);
  });

  it('should call callback with credits on snapshot', () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    const callback = vi.fn();
    mockOnSnapshot.mockImplementation((docRef, cb: any) => {
      // Simulate snapshot callback
      cb({
        exists: () => true,
        data: () => ({
          uid: 'test-user-id',
          credits: mockCreditsAll,
        }),
      });
      return vi.fn(); // unsubscribe
    });

    subscribeToCredits('test-user-id', callback);

    expect(callback).toHaveBeenCalledWith(mockCreditsAll);
  });

  it('should handle missing credits in snapshot (default to zero)', () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    const callback = vi.fn();
    mockOnSnapshot.mockImplementation((docRef, cb: any) => {
      cb({
        exists: () => true,
        data: () => ({
          uid: 'test-user-id',
          // No credits field
        }),
      });
      return vi.fn();
    });

    subscribeToCredits('test-user-id', callback);

    expect(callback).toHaveBeenCalledWith(mockCreditsZero);
  });

  it('should return unsubscribe function', () => {
    const { onSnapshot, doc } = vi.mocked(require('firebase/firestore') as any);
    const mockDoc = vi.mocked(doc);
    const mockOnSnapshot = vi.mocked(onSnapshot);

    mockDoc.mockReturnValue({ path: 'users/test-user-id' } as any);

    const unsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(unsubscribe);

    const result = subscribeToCredits('test-user-id', vi.fn());

    expect(result).toBe(unsubscribe);
    expect(typeof result).toBe('function');
  });
});
