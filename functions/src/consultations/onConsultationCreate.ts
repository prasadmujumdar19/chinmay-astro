import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * onConsultationCreate Trigger
 *
 * Triggered when a new consultation document is created.
 * Creates a notification for the admin to alert them of a new consultation request.
 *
 * Reference: TDD section 8.2.1 "onConsultationCreate Trigger" (lines 6705-6750)
 * Reference: PRD FR-CHAT-005
 *
 * Trigger: consultations/{consultationId}
 * Event: onCreate
 *
 * Actions:
 * 1. Extract consultation data
 * 2. Create notification document for admin
 * 3. (Optional for MVP) Send email notification to admin via Email Trigger Extension
 *
 * Note: Email sending will be implemented in Feature 7 (Notifications) using Firebase Extensions.
 * For now, we create the notification document which can be displayed in admin dashboard.
 */
export const onConsultationCreate = functions.firestore
  .document('consultations/{consultationId}')
  .onCreate(async (snapshot, context) => {
    const db = getFirestore();
    const consultationId = context.params.consultationId;
    const consultationData = snapshot.data();

    try {
      // Extract user information
      const { userId, userName, userEmail, consultationType, threadTitle, chatType } =
        consultationData;

      // Fetch admin user (role = 'admin')
      const usersSnapshot = await db.collection('users').where('role', '==', 'admin').get();

      if (usersSnapshot.empty) {
        console.warn('No admin users found to notify about new consultation');
        return;
      }

      // Create notification for each admin (typically only one admin in this app)
      const notificationPromises = usersSnapshot.docs.map(async (adminDoc) => {
        const adminId = adminDoc.id;

        // Create notification document
        await db.collection('notifications').add({
          userId: adminId,
          type: 'new_consultation',
          title: 'New Consultation Request',
          message: `${userName} (${userEmail}) started a new ${consultationType} consultation${
            chatType === 'scheduling' ? ' (scheduling)' : ''
          }: "${threadTitle}"`,
          consultationId,
          relatedUserId: userId,
          relatedUserName: userName,
          relatedUserEmail: userEmail,
          read: false,
          requiresAttention: true,
          createdAt: FieldValue.serverTimestamp(),
        });

        console.log(
          `Notification created for admin ${adminId} about new consultation ${consultationId}`
        );
      });

      await Promise.all(notificationPromises);

      // Log success
      console.log(`onConsultationCreate: Successfully processed consultation ${consultationId}`);

      // Note: Email notifications will be handled by Firebase Trigger Email Extension
      // in Feature 7 (Notifications) by listening to the notifications collection
    } catch (error) {
      console.error(
        `Error in onConsultationCreate for consultation ${consultationId}:`,
        error
      );
      // Don't throw - we don't want to block the consultation creation
      // Just log the error and continue
    }
  });
