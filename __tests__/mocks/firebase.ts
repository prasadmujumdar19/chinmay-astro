import { vi } from 'vitest';

// Mock Firebase Auth functions
export const mockSignInWithPopup = vi.fn();
export const mockSignOut = vi.fn();
export const mockOnAuthStateChanged = vi.fn();

// Mock GoogleAuthProvider class
export class MockGoogleAuthProvider {
  providerId = 'google.com';
}

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  signOut: mockSignOut,
};

// Mock UserCredential
export const mockUserCredential = {
  user: {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  },
  providerId: 'google.com',
  operationType: 'signIn',
};

// Mock Firebase User
export const mockFirebaseUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  phoneNumber: null,
  providerId: 'firebase',
};
