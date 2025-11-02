import type { User } from '@/types/user';

/**
 * Mock user profile without persona image
 */
export const mockUserProfile: User = {
  uid: 'test-user-123',
  email: 'testuser@example.com',
  name: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  dateOfBirth: new Date('1990-01-15'),
  timeOfBirth: '14:30',
  placeOfBirth: 'Mumbai, India',
  personaImageUrl: null,
  personaImagePath: null,
  personaUploadedAt: null,
  role: 'user',
  credits: {
    chat: 0,
    audio: 0,
    video: 0,
  },
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  lastLoginAt: new Date('2025-01-01T00:00:00Z'),
  agreedToTermsAt: new Date('2025-01-01T00:00:00Z'),
  agreedToPrivacyAt: new Date('2025-01-01T00:00:00Z'),
};

/**
 * Mock user profile with persona image
 */
export const mockUserWithPersona: User = {
  ...mockUserProfile,
  personaImageUrl:
    'https://firebasestorage.googleapis.com/v0/b/chinmay-astro-c685b.appspot.com/o/persona-images%2Ftest-user-123%2Fimage.jpg?alt=media',
  personaImagePath: 'persona-images/test-user-123/image.jpg',
  personaUploadedAt: new Date('2025-01-02T00:00:00Z'),
};

/**
 * Mock admin user profile
 */
export const mockAdminProfile: User = {
  ...mockUserProfile,
  uid: 'test-admin-456',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
};

/**
 * Mock birth details for form testing
 */
export const mockBirthDetails = {
  dateOfBirth: new Date('1990-01-15'),
  timeOfBirth: '14:30',
  placeOfBirth: 'Mumbai, India',
};

/**
 * Mock invalid birth details for validation testing
 */
export const mockInvalidBirthDetails = {
  dateOfBirth: null,
  timeOfBirth: 'invalid-time',
  placeOfBirth: '',
};
