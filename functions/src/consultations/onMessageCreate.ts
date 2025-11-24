import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * onMessageCreate Trigger
 *
 * Triggered when a new message is added to a consultation's messages subcollection.
 *
 * Reference: TDD section 8.2.1 "Firestore Triggers" (lines 6702-6800)
 * Reference: PRD FR-CHAT-006, FR-CHAT-008
 *
 * Trigger: consultations/{consultationId}/messages/{messageId}
 * Event: onCreate
 *
 * Actions:
 * 1. Update consultation's lastActivityAt timestamp
 * 2. If sender is user, create notification for admin
 * 3. If consultation is closed and user sent message, create special "requires attention" notification
 * 4. (Optional for MVP) Send email notification via Email Trigger Extension
 *
 * Note: Email sending will be implemented in Feature 7 (Notifications) using Firebase Extensions.
 */
export const onMessageCreate = functions.firestore
  .document('consultations/{consultationId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const db = getFirestore();
    const consultationId = context.params.consultationId;
    const messageId = context.params.messageId;
    const messageData = snapshot.data();

    try {
      const { senderRole, senderName, text, timestamp } = messageData;

      // 1. Update consultation's lastActivityAt timestamp
      const consultationRef = db.collection('consultations').doc(consultationId);
      const consultationSnapshot = await consultationRef.get();

      if (!consultationSnapshot.exists) {
        console.error(`Consultation ${consultationId} not found`);
        return;
      }

      const consultationData = consultationSnapshot.data()!;

      await consultationRef.update({
        lastActivityAt: timestamp || FieldValue.serverTimestamp(),
      });

      console.log(
        `Updated lastActivityAt for consultation ${consultationId} due to new message ${messageId}`
      );

      // 2. Create notifications
      if (senderRole === 'user') {
        // User sent a message - notify admin
        await createAdminNotification(
          db,
          consultationId,
          consultationData,
          senderName,
          text,
          messageData.isClosingMessage || false
        );
      } else if (senderRole === 'admin') {
        // Admin sent a message - notify user
        await createUserNotification(
          db,
          consultationId,
          consultationData,
          senderName,
          text,
          messageData.isClosingMessage || false
        );
      }

      console.log(`onMessageCreate: Successfully processed message ${messageId}`);
    } catch (error) {
      console.error(`Error in onMessageCreate for message ${messageId}:`, error);
      // Don't throw - we don't want to block the message creation
    }
  });

/**
 * Create notification for admin when user sends a message
 */
async function createAdminNotification(
  db: FirebaseFirestore.Firestore,
  consultationId: string,
  consultationData: FirebaseFirestore.DocumentData,
  senderName: string,
  messageText: string,
  isClosingMessage: boolean
): Promise<void> {
  // Fetch admin user(s)
  const usersSnapshot = await db.collection('users').where('role', '==', 'admin').get();

  if (usersSnapshot.empty) {
    console.warn('No admin users found to notify about new message');
    return;
  }

  // Check if consultation is closed
  const isClosed = consultationData.status === 'closed';
  const requiresAttention = isClosed; // Closed consultation with new user message requires attention

  const notificationPromises = usersSnapshot.docs.map(async (adminDoc) => {
    const adminId = adminDoc.id;

    await db.collection('notifications').add({
      userId: adminId,
      type: isClosed ? 'consultation_followup' : 'new_message',
      title: isClosed ? 'Follow-up on Closed Consultation' : 'New Message',
      message: `${senderName}: ${
        messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText
      }`,
      consultationId,
      relatedUserId: consultationData.userId,
      relatedUserName: senderName,
      relatedUserEmail: consultationData.userEmail,
      read: false,
      requiresAttention,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `Notification created for admin ${adminId} about new message in consultation ${consultationId}${
        requiresAttention ? ' (requires attention - closed consultation)' : ''
      }`
    );
  });

  await Promise.all(notificationPromises);
}

/**
 * Create notification for user when admin sends a message
 */
async function createUserNotification(
  db: FirebaseFirestore.Firestore,
  consultationId: string,
  consultationData: FirebaseFirestore.DocumentData,
  senderName: string,
  messageText: string,
  isClosingMessage: boolean
): Promise<void> {
  const userId = consultationData.userId;

  await db.collection('notifications').add({
    userId,
    type: isClosingMessage ? 'consultation_closed' : 'new_message',
    title: isClosingMessage ? 'Consultation Closed' : 'New Response from Advisor',
    message: `${senderName}: ${
      messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText
    }`,
    consultationId,
    relatedUserId: null, // Admin is sender, no related user
    relatedUserName: senderName,
    relatedUserEmail: null,
    read: false,
    requiresAttention: isClosingMessage, // Closing message requires user attention
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(
    `Notification created for user ${userId} about new message in consultation ${consultationId}${
      isClosingMessage ? ' (consultation closed)' : ''
    }`
  );
}
