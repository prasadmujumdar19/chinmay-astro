/**
 * User type definition matching Firestore schema
 * Reference: TDD section 5.1.2 "Collection: users" (lines 2845-2949)
 */

export type UserRole = 'user' | 'admin';

export interface UserCredits {
  chat: number;
  audio: number;
  video: number;
}

export interface User {
  // Identity
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;

  // Birth Details
  dateOfBirth: Date;
  timeOfBirth: string; // Format: "HH:mm" (24-hour)
  placeOfBirth: string;

  // Persona Image (Admin-uploaded)
  personaImageUrl: string | null;
  personaImagePath: string | null; // Storage path for deletion
  personaUploadedAt: Date | null;

  // Authorization
  role: UserRole;

  // Session Credits
  credits: UserCredits;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;

  // Terms & Privacy
  agreedToTermsAt: Date;
  agreedToPrivacyAt: Date;
}

/**
 * Birth details subset for profile editing
 */
export interface BirthDetails {
  dateOfBirth: Date;
  timeOfBirth: string;
  placeOfBirth: string;
}

/**
 * User profile update payload
 */
export interface UserProfileUpdate {
  name?: string;
  dateOfBirth?: Date;
  timeOfBirth?: string;
  placeOfBirth?: string;
  personaImageUrl?: string | null;
  personaImagePath?: string | null;
  personaUploadedAt?: Date | null;
  updatedAt: Date;
}
