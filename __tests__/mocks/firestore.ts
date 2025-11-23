import { vi } from 'vitest';

/**
 * Mock Firestore document reference
 */
export const mockDocRef = {
  id: 'test-user-123',
  path: 'users/test-user-123',
  parent: {
    id: 'users',
    path: 'users',
  },
};

/**
 * Mock Firestore updateDoc function
 */
export const mockUpdateDoc = vi.fn(() => Promise.resolve());

/**
 * Mock Firestore Timestamp
 */
export const createMockTimestamp = (date: Date) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
});

/**
 * Mock Firestore getDoc function
 */
export const mockGetDoc = vi.fn(() =>
  Promise.resolve({
    exists: () => true,
    data: () => ({
      uid: 'test-user-123',
      email: 'testuser@example.com',
      name: 'Test User',
      dateOfBirth: createMockTimestamp(new Date('1990-01-15')),
      timeOfBirth: '14:30',
      placeOfBirth: 'Mumbai, India',
      photoURL: null,
      personaImageUrl: null,
      personaImagePath: null,
      personaUploadedAt: null,
      role: 'user',
      credits: { chat: 0, audio: 0, video: 0 },
      createdAt: createMockTimestamp(new Date()),
      updatedAt: createMockTimestamp(new Date()),
      lastLoginAt: createMockTimestamp(new Date()),
      agreedToTermsAt: createMockTimestamp(new Date()),
      agreedToPrivacyAt: createMockTimestamp(new Date()),
    }),
    id: 'test-user-123',
    ref: mockDocRef,
  })
);

/**
 * Mock Firestore doc function
 */
export const mockDoc = vi.fn(() => mockDocRef);

/**
 * Mock Firestore collection function
 */
export const mockCollection = vi.fn(() => ({
  id: 'users',
  path: 'users',
}));

/**
 * Mock Firestore onSnapshot function for real-time listeners
 */
export const mockOnSnapshot = vi.fn((_, callback) => {
  // Call the callback immediately with mock data
  callback({
    exists: () => true,
    data: () => ({}),
    id: 'test-doc-id',
  });

  // Return unsubscribe function
  return vi.fn();
});

/**
 * Mock Firestore query function
 */
export const mockQuery = vi.fn(() => ({
  type: 'query',
}));

/**
 * Mock Firestore where clause
 */
export const mockWhere = vi.fn((field, operator, value) => ({
  type: 'where',
  field,
  operator,
  value,
}));

/**
 * Mock Firestore orderBy clause
 */
export const mockOrderBy = vi.fn((field, direction) => ({
  type: 'orderBy',
  field,
  direction,
}));

/**
 * Mock Firestore limit clause
 */
export const mockLimit = vi.fn(count => ({
  type: 'limit',
  count,
}));

/**
 * Mock Firestore addDoc function
 */
export const mockAddDoc = vi.fn(() =>
  Promise.resolve({
    id: 'new-doc-id',
    path: 'consultations/new-doc-id',
  })
);

/**
 * Mock Firestore getDocs function (for queries)
 */
export const mockGetDocs = vi.fn(() =>
  Promise.resolve({
    empty: false,
    size: 0,
    docs: [],
    forEach: vi.fn(),
  })
);

/**
 * Mock Firestore runTransaction function
 */
export const mockRunTransaction = vi.fn(callback => {
  const transaction = {
    get: vi.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({ chat: 5, audio: 0, video: 0 }),
      })
    ),
    update: vi.fn(),
    set: vi.fn(),
  };
  return Promise.resolve(callback(transaction));
});

/**
 * Reset all Firestore mocks
 */
export const resetFirestoreMocks = () => {
  mockUpdateDoc.mockClear();
  mockGetDoc.mockClear();
  mockDoc.mockClear();
  mockCollection.mockClear();
  mockOnSnapshot.mockClear();
  mockQuery.mockClear();
  mockWhere.mockClear();
  mockOrderBy.mockClear();
  mockLimit.mockClear();
  mockAddDoc.mockClear();
  mockGetDocs.mockClear();
  mockRunTransaction.mockClear();
};
