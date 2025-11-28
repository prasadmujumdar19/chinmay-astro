import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import type { CreateConsultationRequest, CreateConsultationResponse } from '../types/consultation';

/**
 * Cloud Function: Create a new consultation
 *
 * Steps:
 * 1. Verify user is authenticated
 * 2. Check if user has sufficient credits (deduct 1 credit)
 * 3. Calculate thread number (sequential for user)
 * 4. Create consultation document
 * 5. Return consultation ID and thread number
 *
 * Reference: TDD section 5.3.1 "createConsultation Cloud Function" (lines 4020-4180)
 * Reference: PRD FR-CHAT-001, FR-CHAT-002
 */
export const createConsultation = functions.https.onCall(
  async (
    data: CreateConsultationRequest,
    context: functions.https.CallableContext
  ): Promise<CreateConsultationResponse> => {
    // 1. Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to create a consultation'
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      // 2. Check credits and deduct
      const sessionCreditsRef = db.collection('sessionCredits').doc(userId);
      const creditsDoc = await sessionCreditsRef.get();

      if (!creditsDoc.exists) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Session credits not found. Please contact support.'
        );
      }

      const currentCredits = creditsDoc.data()?.availableCredits || 0;

      if (currentCredits < 1) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Insufficient credits. Please purchase more session credits.'
        );
      }

      // 3. Calculate thread number (only for chat consultations)
      let threadNumber: number | null = null;

      if (data.consultationType === 'chat' && data.chatType === 'consultation') {
        const userConsultationsSnapshot = await db
          .collection('consultations')
          .where('userId', '==', userId)
          .where('consultationType', '==', 'chat')
          .where('chatType', '==', 'consultation')
          .orderBy('threadNumber', 'desc')
          .limit(1)
          .get();

        if (userConsultationsSnapshot.empty) {
          threadNumber = 1;
        } else {
          const lastThreadNumber = userConsultationsSnapshot.docs[0].data().threadNumber || 0;
          threadNumber = lastThreadNumber + 1;
        }
      }

      // Get user info
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'User profile not found. Please contact support.'
        );
      }

      // 4. Create consultation document
      const consultationData = {
        userId,
        userName: userData.displayName || 'Anonymous',
        userEmail: userData.email || '',
        consultationType: data.consultationType,
        chatType: data.chatType || null,
        status: data.consultationType === 'chat' ? 'active' : 'pending_scheduling',
        threadNumber,
        threadTitle: data.threadTitle,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        closedAt: null,
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const consultationRef = await db.collection('consultations').add(consultationData);

      // Deduct 1 credit
      await sessionCreditsRef.update({
        availableCredits: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Return response
      return {
        consultationId: consultationRef.id,
        threadNumber: threadNumber || 0,
      };
    } catch (error) {
      // Re-throw HttpsError as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Log unexpected errors
      console.error('Error creating consultation:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create consultation. Please try again.'
      );
    }
  }
);
