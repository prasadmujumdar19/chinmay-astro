/**
 * Session query utilities
 * Feature 6 - Task 3.0.5
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { AudioVideoSession, SchedulingChat } from '@/types/sessions';

/**
 * Get sessions by status
 * If userId provided, filters by user; otherwise returns all sessions (admin view)
 */
async function getSessionsByStatus(status: string, userId?: string): Promise<AudioVideoSession[]> {
  const constraints: QueryConstraint[] = [
    where('type', 'in', ['audio', 'video']),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
  ];

  if (userId) {
    constraints.unshift(where('userId', '==', userId));
  }

  const q = query(collection(db, 'consultations'), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as AudioVideoSession
  );
}

/**
 * Get all pending scheduling sessions
 * @param userId - Optional user ID to filter by
 * @returns Array of sessions with status "pending_scheduling"
 */
export async function getPendingSessions(userId?: string): Promise<AudioVideoSession[]> {
  return getSessionsByStatus('pending_scheduling', userId);
}

/**
 * Get all scheduled sessions
 * @param userId - Optional user ID to filter by
 * @returns Array of sessions with status "scheduled"
 */
export async function getScheduledSessions(userId?: string): Promise<AudioVideoSession[]> {
  return getSessionsByStatus('scheduled', userId);
}

/**
 * Get user's completed sessions
 * @param userId - User ID
 * @returns Array of completed sessions
 */
export async function getCompletedSessions(userId: string): Promise<AudioVideoSession[]> {
  return getSessionsByStatus('completed', userId);
}

/**
 * Get session with its related scheduling chat
 * Returns both the session and the linked scheduling chat consultation
 *
 * @param sessionId - Session document ID
 * @returns Object with session and scheduling chat
 * @throws Error if session not found
 */
export async function getSessionWithSchedulingChat(sessionId: string): Promise<{
  session: AudioVideoSession;
  schedulingChat: SchedulingChat | null;
}> {
  // Get session
  const sessionRef = doc(db, 'consultations', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found');
  }

  const session = {
    id: sessionSnap.id,
    ...sessionSnap.data(),
  } as AudioVideoSession;

  // Get scheduling chat if exists
  let schedulingChat: SchedulingChat | null = null;

  if (session.relatedSessionId) {
    const chatRef = doc(db, 'consultations', session.relatedSessionId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      schedulingChat = {
        id: chatSnap.id,
        ...chatSnap.data(),
      } as SchedulingChat;
    }
  }

  return { session, schedulingChat };
}

/**
 * Get all sessions for a user (all statuses)
 * @param userId - User ID
 * @returns Array of all user sessions
 */
export async function getAllUserSessions(userId: string): Promise<AudioVideoSession[]> {
  const q = query(
    collection(db, 'consultations'),
    where('userId', '==', userId),
    where('type', 'in', ['audio', 'video']),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as AudioVideoSession
  );
}
