import { vi, expect } from 'vitest';
import type { DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';

/**
 * Test utilities for Firestore real-time listeners
 *
 * Reference: TDD section 4.3.3 "Testing Async Listeners" (lines 2670-2750)
 */

/**
 * Create a mock document snapshot
 */
export const createMockDocumentSnapshot = <T>(
  data: T | null,
  id = 'test-doc-id'
): Partial<DocumentSnapshot<T>> => {
  const snapshot = {
    exists: () => data !== null,
    data: () => data as T,
    id,
    ref: {
      id,
      path: `collection/${id}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return snapshot as any;
};

/**
 * Create a mock query snapshot
 */
export const createMockQuerySnapshot = <T>(
  docs: Array<{ id: string; data: T }>
): Partial<QuerySnapshot<T>> => {
  const mockDocs = docs.map(doc => createMockDocumentSnapshot(doc.data, doc.id));

  return {
    empty: docs.length === 0,
    size: docs.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    docs: mockDocs as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forEach: (callback: (doc: any) => void) => {
      mockDocs.forEach(callback);
    },
  };
};

/**
 * Helper to simulate Firestore onSnapshot updates
 *
 * Usage:
 * ```
 * const { triggerUpdate, unsubscribe } = simulateOnSnapshot(callback);
 * triggerUpdate({ newData: 'value' });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const simulateOnSnapshot = <T>(callback: (snapshot: any) => void) => {
  const triggerRef = { current: callback };

  const triggerUpdate = (data: T | null, id = 'test-doc-id') => {
    const snapshot = createMockDocumentSnapshot(data, id);
    triggerRef.current(snapshot);
  };

  const triggerQueryUpdate = (docs: Array<{ id: string; data: T }>) => {
    const snapshot = createMockQuerySnapshot(docs);
    triggerRef.current(snapshot);
  };

  const unsubscribe = vi.fn();

  return {
    triggerUpdate,
    triggerQueryUpdate,
    unsubscribe,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateCallback: (newCallback: (snapshot: any) => void) => {
      triggerRef.current = newCallback;
    },
  };
};

/**
 * Wait for async updates in tests
 *
 * Usage:
 * ```
 * await waitForAsync();
 * expect(state).toBe('updated');
 * ```
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Wait for multiple async updates (for complex state changes)
 */
export const waitForMultipleAsync = (count = 2) =>
  Promise.all(
    Array(count)
      .fill(0)
      .map(() => waitForAsync())
  );

/**
 * Create a controlled promise for testing async flows
 *
 * Usage:
 * ```
 * const { promise, resolve, reject } = createControlledPromise();
 * someAsyncFunction().then(() => resolve('done'));
 * await promise;
 * ```
 */
export const createControlledPromise = <T = void>() => {
  let resolveFunc: (value: T) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rejectFunc: (error: any) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveFunc = resolve;
    rejectFunc = reject;
  });

  return {
    promise,
    resolve: resolveFunc!,
    reject: rejectFunc!,
  };
};

/**
 * Mock Firestore Timestamp for tests
 */
export const createMockTimestamp = (date: Date = new Date()) => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  isEqual: () => false,
  valueOf: () => '',
});

/**
 * Helper to test listener cleanup (checks if unsubscribe was called)
 *
 * Usage:
 * ```
 * const unsubscribe = vi.fn();
 * const { result, unmount } = renderHook(() => useMessages(consultationId));
 * unmount();
 * expectListenerCleanedUp(unsubscribe);
 * ```
 */
export const expectListenerCleanedUp = (unsubscribeFn: ReturnType<typeof vi.fn>) => {
  expect(unsubscribeFn).toHaveBeenCalled();
};

/**
 * Create a mock Firestore error
 */
export const createFirestoreError = (code: string, message: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error: any = new Error(message);
  error.code = `firestore/${code}`;
  return error;
};

/**
 * Common Firestore error codes for testing
 */
export const FirestoreErrorCodes = {
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  FAILED_PRECONDITION: 'failed-precondition',
  UNAVAILABLE: 'unavailable',
  UNAUTHENTICATED: 'unauthenticated',
};
