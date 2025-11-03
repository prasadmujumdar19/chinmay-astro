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
 * Reset all Firestore mocks
 */
export const resetFirestoreMocks = () => {
  mockUpdateDoc.mockClear();
  mockGetDoc.mockClear();
  mockDoc.mockClear();
  mockCollection.mockClear();
};
