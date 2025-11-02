import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firestore';
import type { UserProfile, UserRole } from '@/types/auth';

/**
 * Fetch user profile from Firestore by UID
 * @param uid - User ID
 * @returns UserProfile or null if not found
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
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
      dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : null,
      timeOfBirth: data.timeOfBirth || null,
      placeOfBirth: data.placeOfBirth || null,
      personaImageUrl: data.personaImageUrl || null,
      role: data.role as UserRole,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    };
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
}

/**
 * Create a new user profile in Firestore
 * @param uid - User ID
 * @param email - User email
 * @param name - User display name
 * @throws Error if user already exists
 */
export async function createUserProfile(uid: string, email: string, name: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    // Check if user already exists
    const existingUser = await getDoc(userRef);
    if (existingUser.exists()) {
      throw new Error('User already exists');
    }

    // Create user document
    await setDoc(userRef, {
      uid,
      email,
      name,
      dateOfBirth: null,
      timeOfBirth: null,
      placeOfBirth: null,
      personaImageUrl: null,
      role: 'user' as UserRole, // Default role
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Update user profile fields
 * @param uid - User ID
 * @param updates - Partial user profile updates
 * @throws Error if trying to update role field
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'role' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    // Security: Prevent role field updates
    if ('role' in updates) {
      throw new Error('Cannot update role field');
    }

    // Update user document
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
