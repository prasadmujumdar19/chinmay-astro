/**
 * Create scheduling chat for audio/video session coordination
 * Feature 6 - Task 3.0.2
 */

import { collection, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CreateSchedulingChatParams, SchedulingChat } from '@/types/sessions';

/**
 * Create a scheduling chat for coordinating session timing
 * Admin-only function - creates chat thread and links it bidirectionally to session
 *
 * @param params - Scheduling chat parameters
 * @returns Created scheduling chat document
 * @throws Error if validation fails or session not found
 */
export async function createSchedulingChat(
  params: CreateSchedulingChatParams
): Promise<SchedulingChat> {
  // Validation
  if (!params.sessionId || params.sessionId.trim() === '') {
    throw new Error('sessionId is required');
  }

  if (!params.userId || params.userId.trim() === '') {
    throw new Error('userId is required');
  }

  // Verify session exists and is in correct state
  const sessionRef = doc(db, 'consultations', params.sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found');
  }

  const sessionData = sessionSnap.data();

  // Check if session already has a scheduling chat
  if (sessionData.relatedSessionId !== null) {
    throw new Error('Session already has a scheduling chat');
  }

  // Check if session is in pending_scheduling status
  if (sessionData.status !== 'pending_scheduling') {
    throw new Error('Can only create scheduling chat for pending sessions');
  }

  const now = Timestamp.now();
  const threadTitle =
    params.sessionType === 'audio' ? 'Audio Session Scheduling' : 'Video Session Scheduling';

  // Create scheduling chat document
  const chatData = {
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    type: 'chat' as const,
    chatType: 'scheduling' as const,
    status: 'active' as const,
    threadNumber: null,
    threadTitle,
    relatedSessionId: params.sessionId,
    scheduledDateTime: null,
    meetingLink: null,
    createdAt: now,
    lastActivityAt: now,
    closedAt: null,
    completedAt: null,
    messageCount: 0,
    unreadByAdmin: 0,
    creditDeducted: false, // Never deduct credits for scheduling chats
    creditType: params.sessionType,
  };

  // Save scheduling chat to Firestore
  const chatRef = await addDoc(collection(db, 'consultations'), chatData);

  // Update session's relatedSessionId to point to this chat (bidirectional link)
  await updateDoc(sessionRef, {
    relatedSessionId: chatRef.id,
    lastActivityAt: now,
  });

  // Return created scheduling chat with ID
  return {
    id: chatRef.id,
    ...chatData,
  } as SchedulingChat;
}
