/**
 * Firestore utilities for credit operations
 * Handles reading and subscribing to user credit balances
 */

import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase/config';
import type { Credits } from '@/types/credits';

const db = getFirestore(firebaseApp);

/**
 * Default credits when user has no credits or credits field is missing
 */
const DEFAULT_CREDITS: Credits = {
  chat: 0,
  audio: 0,
  video: 0,
};

/**
 * Get user credits from Firestore
 * @param userId - User ID
 * @returns Credits object
 * @throws Error if user document doesn't exist
 */
export async function getUserCredits(userId: string): Promise<Credits> {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  return userData.credits || DEFAULT_CREDITS;
}

/**
 * Subscribe to user credit updates in real-time
 * @param userId - User ID
 * @param callback - Callback function called when credits change
 * @returns Unsubscribe function
 */
export function subscribeToCredits(
  userId: string,
  callback: (credits: Credits) => void
): () => void {
  const userDocRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        const credits = userData.credits || DEFAULT_CREDITS;
        callback(credits);
      }
    },
    error => {
      console.error('Error subscribing to credits:', error);
      throw error;
    }
  );

  return unsubscribe;
}
