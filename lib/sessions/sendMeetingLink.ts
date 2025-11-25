/**
 * Send meeting link via email to user
 * Feature 6 - Task 3.0.4
 */

import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SendMeetingLinkParams, AudioVideoSession } from '@/types/sessions';

/**
 * Validate meeting link format (Google Meet or Zoom)
 */
function isValidMeetingLink(link: string): boolean {
  const googleMeetPattern = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  const zoomPattern = /^https:\/\/zoom\.us\/j\/\d{9,11}(\?pwd=.+)?$/;

  return googleMeetPattern.test(link) || zoomPattern.test(link);
}

/**
 * Send meeting link to user via email
 * Admin function - sends Google Meet/Zoom link and stores it in session
 *
 * @param params - Meeting link parameters
 * @returns Updated session with meeting link
 * @throws Error if validation fails
 */
export async function sendMeetingLink(params: SendMeetingLinkParams): Promise<AudioVideoSession> {
  // Validation
  if (!params.sessionId || params.sessionId.trim() === '') {
    throw new Error('sessionId is required');
  }

  if (!params.meetingLink || params.meetingLink.trim() === '') {
    throw new Error('Meeting link is required');
  }

  if (!isValidMeetingLink(params.meetingLink)) {
    throw new Error('Invalid meeting link format');
  }

  // Get session document
  const sessionRef = doc(db, 'consultations', params.sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found');
  }

  const sessionData = sessionSnap.data();

  // TODO: Send email via Firebase Email Extension or SendGrid
  // For now, we'll just store the meeting link
  // Email sending will be implemented via Cloud Function in production

  // Update session with meeting link
  const now = Timestamp.now();
  await updateDoc(sessionRef, {
    meetingLink: params.meetingLink,
    lastActivityAt: now,
  });

  // Log email attempt (in production, this would trigger Cloud Function)
  console.log('Meeting link email would be sent to:', params.userEmail);
  console.log('Meeting link:', params.meetingLink);
  console.log('Session type:', params.sessionType);
  console.log('Scheduled for:', params.scheduledDateTime);

  // Return updated session
  return {
    id: params.sessionId,
    ...sessionData,
    meetingLink: params.meetingLink,
    lastActivityAt: now,
  } as AudioVideoSession;
}
