import type { UserProfile, UserRole } from '@/types/auth';

// Mock regular user
export const mockRegularUser: UserProfile = {
  uid: 'test-user-123',
  email: 'user@example.com',
  name: 'Test User',
  dateOfBirth: null,
  timeOfBirth: null,
  placeOfBirth: null,
  personaImageUrl: null,
  role: 'user' as UserRole,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

// Mock admin user
export const mockAdminUser: UserProfile = {
  uid: 'admin-user-123',
  email: 'admin@chinmayastro.com',
  name: 'Admin User',
  dateOfBirth: null,
  timeOfBirth: null,
  placeOfBirth: null,
  personaImageUrl: null,
  role: 'admin' as UserRole,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

// Mock Firebase User object (regular)
export const mockFirebaseUserRegular = {
  uid: 'test-user-123',
  email: 'user@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2025-01-01T00:00:00Z',
    lastSignInTime: '2025-01-01T00:00:00Z',
  },
  providerData: [
    {
      providerId: 'google.com',
      uid: 'google-uid-123',
      displayName: 'Test User',
      email: 'user@example.com',
      photoURL: null,
      phoneNumber: null,
    },
  ],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
};

// Mock Firebase User object (admin)
export const mockFirebaseUserAdmin = {
  uid: 'admin-user-123',
  email: 'admin@chinmayastro.com',
  displayName: 'Admin User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2025-01-01T00:00:00Z',
    lastSignInTime: '2025-01-01T00:00:00Z',
  },
  providerData: [
    {
      providerId: 'google.com',
      uid: 'google-uid-admin',
      displayName: 'Admin User',
      email: 'admin@chinmayastro.com',
      photoURL: null,
      phoneNumber: null,
    },
  ],
  refreshToken: 'mock-refresh-token-admin',
  tenantId: null,
};
