/**
 * Mock Firestore utilities for credits testing
 * Provides mock implementations of getDoc, onSnapshot for user document credit reads
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from 'vitest';
import type { Credits } from '@/types/credits';
import { mockCreditsSome, mockCreditsAll } from '../fixtures/credits';

/**
 * Mock DocumentSnapshot for user document with credits
 */
export const createMockUserDocWithCredits = (credits: Credits) => ({
  exists: () => true,
  data: () => ({
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
    credits,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  id: 'test-user-id',
});

/**
 * Mock DocumentSnapshot for user document without credits field
 * (should default to zero credits)
 */
export const createMockUserDocWithoutCredits = () => ({
  exists: () => true,
  data: () => ({
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
    // No credits field
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  id: 'test-user-id',
});

/**
 * Mock DocumentSnapshot for non-existent user
 */
export const createMockUserDocNotFound = () => ({
  exists: () => false,
  data: () => undefined,
  id: undefined,
});

/**
 * Mock getDoc function that returns credits
 */
export const createMockGetDoc = (credits: Credits = mockCreditsAll) =>
  vi.fn().mockResolvedValue(createMockUserDocWithCredits(credits));

/**
 * Mock getDoc function that returns user without credits field
 */
export const createMockGetDocWithoutCredits = () =>
  vi.fn().mockResolvedValue(createMockUserDocWithoutCredits());

/**
 * Mock getDoc function that returns non-existent user
 */
export const createMockGetDocNotFound = () =>
  vi.fn().mockResolvedValue(createMockUserDocNotFound());

/**
 * Mock getDoc function that throws error
 */
export const createMockGetDocError = (errorMessage = 'Firestore error') =>
  vi.fn().mockRejectedValue(new Error(errorMessage));

/**
 * Mock onSnapshot function for real-time credit updates
 * Returns unsubscribe function
 */
export const createMockOnSnapshot = (credits: Credits = mockCreditsAll) => {
  const callback = vi.fn();
  const unsubscribe = vi.fn();

  const mockOnSnapshot = vi.fn((docRef: any, cb: any) => {
    callback.mockImplementation(cb);
    // Immediately call callback with initial data
    cb(createMockUserDocWithCredits(credits));
    return unsubscribe;
  });

  return { mockOnSnapshot, callback, unsubscribe };
};

/**
 * Mock onSnapshot that simulates credit update
 */
export const createMockOnSnapshotWithUpdate = () => {
  let currentCredits = mockCreditsSome;
  const callbacks: any[] = [];

  const mockOnSnapshot = vi.fn((docRef: any, cb: any) => {
    callbacks.push(cb);
    // Immediately call callback with initial data
    cb(createMockUserDocWithCredits(currentCredits));

    // Return unsubscribe function
    return vi.fn(() => {
      const index = callbacks.indexOf(cb);
      if (index > -1) callbacks.splice(index, 1);
    });
  });

  // Helper to simulate credit update
  const simulateUpdate = (newCredits: Credits) => {
    currentCredits = newCredits;
    callbacks.forEach(cb => cb(createMockUserDocWithCredits(newCredits)));
  };

  return { mockOnSnapshot, simulateUpdate };
};

/**
 * Mock onSnapshot that throws error
 */
export const createMockOnSnapshotError = (errorMessage = 'Firestore listener error') =>
  vi.fn(() => {
    throw new Error(errorMessage);
  });
