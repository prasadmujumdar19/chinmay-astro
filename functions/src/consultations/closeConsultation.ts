import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import type { CloseConsultationRequest } from '../types/consultation';

/**
 * Cloud Function: Close a consultation with a final message
 *
 * Steps:
 * 1. Verify user is authenticated and is admin
 * 2. Add closing message to consultation
 * 3. Update consultation status to 'closed'
 *
 * Reference: TDD section 5.3.2 "closeConsultation Cloud Function" (lines 4181-4280)
 * Reference: PRD FR-CHAT-009
 */
export const closeConsultation = functions.https.onCall(
  async (
    data: CloseConsultationRequest,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> => {
    // 1. Verify authentication and admin role
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to close consultations'
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      // Verify user is admin
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || userData.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can close consultations'
        );
      }

      const { consultationId, closingMessage } = data;

      // Validate inputs
      if (!consultationId) {
        throw new functions.https.HttpsError('invalid-argument', 'Consultation ID is required');
      }

      if (!closingMessage || closingMessage.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Closing message is required');
      }

      if (closingMessage.length > 2000) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Message too long. Maximum 2000 characters.'
        );
      }

      // 2. Add closing message
      const messagesRef = db.collection('consultations').doc(consultationId).collection('messages');

      await messagesRef.add({
        consultationId,
        senderId: userId,
        senderRole: 'admin',
        senderName: userData.displayName || 'Admin',
        text: closingMessage.trim(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        readByAdmin: true,
        readByUser: false,
        isClosingMessage: true,
        isReopeningMessage: false,
      });

      // 3. Update consultation status
      const consultationRef = db.collection('consultations').doc(consultationId);
      await consultationRef.update({
        status: 'closed',
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      // Re-throw HttpsError as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Log unexpected errors
      console.error('Error closing consultation:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to close consultation. Please try again.'
      );
    }
  }
);
