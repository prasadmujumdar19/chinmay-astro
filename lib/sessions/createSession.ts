/**
 * Create audio/video session on credit purchase
 * Feature 6 - Task 3.0.1
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CreateSessionParams, AudioVideoSession } from '@/types/sessions';

/**
 * Create a new audio or video session
 * Called when user purchases audio/video credits
 *
 * @param params - Session creation parameters
 * @returns Created session document
 * @throws Error if validation fails
 */
export async function createSession(params: CreateSessionParams): Promise<AudioVideoSession> {
  // Validation
  if (!params.userId || params.userId.trim() === '') {
    throw new Error('userId is required');
  }

  if (!params.userName || params.userName.trim() === '') {
    throw new Error('userName is required');
  }

  if (!params.userEmail || params.userEmail.trim() === '') {
    throw new Error('userEmail is required');
  }

  if (params.type !== 'audio' && params.type !== 'video') {
    throw new Error('Invalid session type');
  }

  const now = Timestamp.now();

  // Create session document
  const sessionData = {
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    type: params.type,
    chatType: null,
    status: 'pending_scheduling' as const,
    threadNumber: null,
    threadTitle: null,
    relatedSessionId: null,
    scheduledDateTime: null,
    meetingLink: null,
    createdAt: now,
    lastActivityAt: now,
    closedAt: null,
    completedAt: null,
    messageCount: 0,
    unreadByAdmin: 0,
    creditDeducted: true,
    creditType: params.creditType,
  };

  // Save to Firestore
  const docRef = await addDoc(collection(db, 'consultations'), sessionData);

  // Return created session with ID
  return {
    id: docRef.id,
    ...sessionData,
  } as AudioVideoSession;
}
