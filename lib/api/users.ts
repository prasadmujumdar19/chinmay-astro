/**
 * User profile API client
 * Reference: TDD section 5.1.2 "Collection: users" (lines 2845-2949)
 *
 * Handles user profile operations including birth details and persona images
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { User } from '@/types/user';

/**
 * Fetch user profile from Firestore by UID
 *
 * @param uid - User ID
 * @returns User profile or null if not found
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data() as DocumentData;

    // Convert Firestore Timestamps to Date objects
    return {
      uid: data.uid,
      email: data.email,
      name: data.name,
      photoURL: data.photoURL || null,
      dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : new Date(),
      timeOfBirth: data.timeOfBirth || '',
      placeOfBirth: data.placeOfBirth || '',
      personaImageUrl: data.personaImageUrl || null,
      personaImagePath: data.personaImagePath || null,
      personaUploadedAt: data.personaUploadedAt
        ? (data.personaUploadedAt as Timestamp).toDate()
        : null,
      role: data.role || 'user',
      credits: data.credits || { chat: 0, audio: 0, video: 0 },
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      lastLoginAt: (data.lastLoginAt as Timestamp).toDate(),
      agreedToTermsAt: (data.agreedToTermsAt as Timestamp).toDate(),
      agreedToPrivacyAt: (data.agreedToPrivacyAt as Timestamp).toDate(),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
}

/**
 * Update user profile fields
 *
 * @param uid - User ID
 * @param updates - Profile updates (excluding uid, role, createdAt)
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<User, 'uid' | 'role' | 'createdAt' | 'credits'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    // Prepare update object with server timestamp
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Convert Date objects to Timestamps for Firestore
    if (updates.dateOfBirth instanceof Date) {
      updateData.dateOfBirth = Timestamp.fromDate(updates.dateOfBirth);
    }
    if (updates.personaUploadedAt instanceof Date) {
      updateData.personaUploadedAt = Timestamp.fromDate(updates.personaUploadedAt);
    }
    if (updates.lastLoginAt instanceof Date) {
      updateData.lastLoginAt = Timestamp.fromDate(updates.lastLoginAt);
    }

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Update persona image for a user (admin only)
 *
 * @param uid - User ID
 * @param imageUrl - Public download URL
 * @param imagePath - Storage path for deletion
 */
export async function updatePersonaImage(
  uid: string,
  imageUrl: string,
  imagePath: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      personaImageUrl: imageUrl,
      personaImagePath: imagePath,
      personaUploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating persona image:', error);
    throw new Error('Failed to update persona image');
  }
}

/**
 * Remove persona image from user profile
 *
 * @param uid - User ID
 */
export async function removePersonaImage(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      personaImageUrl: null,
      personaImagePath: null,
      personaUploadedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing persona image:', error);
    throw new Error('Failed to remove persona image');
  }
}
