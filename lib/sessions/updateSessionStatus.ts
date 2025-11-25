/**
 * Update session status (admin functions)
 * Feature 6 - Task 3.0.3
 */

import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { AudioVideoSession } from '@/types/sessions';

/**
 * Update session status to "scheduled" with confirmed date/time
 * Admin-only function
 *
 * @param sessionId - Session document ID
 * @param scheduledDateTime - Confirmed date and time for session
 * @returns Updated session document
 * @throws Error if session not found or invalid state
 */
export async function updateSessionToScheduled(
  sessionId: string,
  scheduledDateTime: Date
): Promise<AudioVideoSession> {
  // Get session document
  const sessionRef = doc(db, 'consultations', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found');
  }

  const sessionData = sessionSnap.data();

  // Verify session is in pending_scheduling status
  if (sessionData.status !== 'pending_scheduling') {
    throw new Error('Session must be in pending_scheduling status');
  }

  // Verify scheduled date is in the future
  if (scheduledDateTime.getTime() <= Date.now()) {
    throw new Error('Scheduled date/time must be in the future');
  }

  const now = Timestamp.now();
  const scheduledTimestamp = Timestamp.fromDate(scheduledDateTime);

  // Update session
  await updateDoc(sessionRef, {
    status: 'scheduled',
    scheduledDateTime: scheduledTimestamp,
    lastActivityAt: now,
  });

  // Return updated session
  return {
    id: sessionId,
    ...sessionData,
    status: 'scheduled',
    scheduledDateTime: scheduledTimestamp,
    lastActivityAt: now,
  } as AudioVideoSession;
}

/**
 * Update session status to "completed"
 * Admin-only function - marks session as complete after external meeting
 *
 * @param sessionId - Session document ID
 * @returns Updated session document
 * @throws Error if session not found or invalid state
 */
export async function updateSessionToCompleted(sessionId: string): Promise<AudioVideoSession> {
  // Get session document
  const sessionRef = doc(db, 'consultations', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found');
  }

  const sessionData = sessionSnap.data();

  // Verify session is in scheduled status
  if (sessionData.status === 'completed') {
    throw new Error('Session is already completed');
  }

  if (sessionData.status !== 'scheduled') {
    throw new Error('Session must be in scheduled status');
  }

  const now = Timestamp.now();

  // Update session
  await updateDoc(sessionRef, {
    status: 'completed',
    completedAt: now,
    lastActivityAt: now,
  });

  // Return updated session
  return {
    id: sessionId,
    ...sessionData,
    status: 'completed',
    completedAt: now,
    lastActivityAt: now,
  } as AudioVideoSession;
}
