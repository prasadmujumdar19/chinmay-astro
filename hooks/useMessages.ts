import { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase/config';
import { useAuthStore } from '@/stores/authStore';
import { validateMessage } from '@/lib/utils/chatUtils';
import type { Consultation, Message } from '@/types/consultation';

/**
 * Hook for managing real-time message synchronization
 *
 * Reference: TDD section 11.1.1 "useMessages Hook" (lines 10040-10160)
 * Reference: PRD FR-CHAT-006, FR-CHAT-008
 */
export function useMessages(consultationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  // Setup real-time listeners for consultation and messages
  useEffect(() => {
    if (!consultationId) {
      setError('Consultation ID is required');
      setLoading(false);
      return;
    }

    const db = getFirestore(firebaseApp);

    // Listen to consultation document
    const consultationRef = doc(db, 'consultations', consultationId);
    const unsubscribeConsultation = onSnapshot(
      consultationRef,
      docSnap => {
        if (!docSnap.exists()) {
          setError('Consultation not found');
          setLoading(false);
          return;
        }

        const data = docSnap.data();
        setConsultation({
          id: docSnap.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          consultationType: data.consultationType,
          chatType: data.chatType,
          status: data.status,
          threadNumber: data.threadNumber,
          threadTitle: data.threadTitle,
          createdAt: data.createdAt as Timestamp,
          closedAt: data.closedAt as Timestamp | null,
          lastActivityAt: data.lastActivityAt as Timestamp,
        });
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Listen to messages subcollection
    const messagesRef = collection(db, 'consultations', consultationId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      snapshot => {
        const messagesData: Message[] = [];
        snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const data = docSnap.data();
          messagesData.push({
            id: docSnap.id,
            consultationId,
            senderId: data.senderId,
            senderRole: data.senderRole,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp as Timestamp,
            readByAdmin: data.readByAdmin,
            readByUser: data.readByUser,
            isClosingMessage: data.isClosingMessage || false,
            isReopeningMessage: data.isReopeningMessage || false,
          });
        });

        setMessages(messagesData);
      },
      err => {
        setError(err.message);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeConsultation();
      unsubscribeMessages();
    };
  }, [consultationId]);

  /**
   * Send a new message to the consultation
   *
   * Reference: TDD section 11.1.2 "Send Message" (lines 10161-10240)
   * Reference: PRD FR-CHAT-006
   */
  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      // Validation using utility
      const validationError = validateMessage(text);
      if (validationError) {
        throw new Error(validationError);
      }

      if (!user) {
        throw new Error('You must be signed in to send messages');
      }

      const trimmedText = text.trim();

      const db = getFirestore(firebaseApp);
      const messagesRef = collection(db, 'consultations', consultationId, 'messages');

      // Determine read status based on sender role
      const isUser = user.role === 'user';
      const messageData = {
        consultationId,
        senderId: user.uid,
        senderRole: user.role,
        senderName: user.name || 'Anonymous',
        text: trimmedText,
        timestamp: Timestamp.now(),
        readByAdmin: !isUser, // If admin sends, mark as read by admin
        readByUser: isUser, // If user sends, mark as read by user
        isClosingMessage: false,
        isReopeningMessage: false,
      };

      await addDoc(messagesRef, messageData);

      // Update lastActivityAt on consultation
      const consultationRef = doc(db, 'consultations', consultationId);
      await updateDoc(consultationRef, {
        lastActivityAt: Timestamp.now(),
      });
    },
    [consultationId, user]
  );

  /**
   * Mark messages as read by current user
   *
   * Reference: TDD section 11.1.3 "Mark Messages as Read" (lines 10241-10310)
   * Reference: PRD FR-CHAT-008
   */
  const markMessagesAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    const db = getFirestore(firebaseApp);
    const messagesRef = collection(db, 'consultations', consultationId, 'messages');

    // Filter unread messages based on role
    const unreadMessages = messages.filter(msg => {
      if (user.role === 'admin') {
        return !msg.readByAdmin && msg.senderRole === 'user';
      } else {
        return !msg.readByUser && msg.senderRole === 'admin';
      }
    });

    // Update each unread message
    const updatePromises = unreadMessages.map(msg => {
      const messageRef = doc(messagesRef, msg.id);
      const updateData = user.role === 'admin' ? { readByAdmin: true } : { readByUser: true };

      return updateDoc(messageRef, updateData).catch(err => {
        // Log error but don't throw - mark as read is best-effort
        console.error('Failed to mark message as read:', err);
      });
    });

    await Promise.all(updatePromises);
  }, [consultationId, messages, user]);

  return {
    messages,
    consultation,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
  };
}
