import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/lib/firebase/config';
import type {
  Consultation,
  CreateConsultationRequest,
  CreateConsultationResponse,
  ConsultationStatus,
} from '@/types/consultation';

/**
 * Create a new consultation by calling the Cloud Function
 *
 * Reference: TDD section 5.2.1 "Create Consultation" (lines 3720-3820)
 * Reference: PRD FR-CHAT-001, FR-CHAT-002
 */
export async function createConsultation(
  request: CreateConsultationRequest
): Promise<CreateConsultationResponse> {
  const functions = getFunctions(firebaseApp);
  const createConsultationFn = httpsCallable<CreateConsultationRequest, CreateConsultationResponse>(
    functions,
    'createConsultation'
  );

  try {
    const result = await createConsultationFn(request);
    return result.data;
  } catch (error: unknown) {
    // Handle specific Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };

      if (firebaseError.code === 'functions/unauthenticated') {
        throw new Error('You must be signed in to create a consultation');
      }

      if (firebaseError.message.includes('Insufficient credits')) {
        throw new Error('Insufficient credits. Please purchase more session credits.');
      }
    }

    // Re-throw original error if not handled
    throw error;
  }
}

/**
 * Get all consultations for a user, ordered by last activity
 *
 * Reference: TDD section 5.2.2 "Fetch User Consultations" (lines 3821-3900)
 * Reference: PRD FR-CHAT-003
 */
export async function getUserConsultations(userId: string): Promise<Consultation[]> {
  const db = getFirestore(firebaseApp);
  const consultationsRef = collection(db, 'consultations');

  const q = query(
    consultationsRef,
    where('userId', '==', userId),
    orderBy('lastActivityAt', 'desc')
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  const consultations: Consultation[] = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    consultations.push({
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
  });

  return consultations;
}

/**
 * Update consultation status (e.g., active → closed)
 *
 * Reference: TDD section 5.2.3 "Update Consultation Status" (lines 3901-3950)
 * Reference: PRD FR-CHAT-009
 */
export async function updateConsultationStatus(
  consultationId: string,
  newStatus: ConsultationStatus
): Promise<void> {
  const db = getFirestore(firebaseApp);
  const consultationRef = doc(db, 'consultations', consultationId);

  const updateData: {
    status: ConsultationStatus;
    closedAt?: Timestamp;
  } = {
    status: newStatus,
  };

  // Set closedAt timestamp when closing consultation
  if (newStatus === 'closed') {
    updateData.closedAt = Timestamp.now();
  }

  try {
    await updateDoc(consultationRef, updateData);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };

      if (firebaseError.code === 'firestore/not-found') {
        throw new Error('Consultation not found');
      }
    }

    throw error;
  }
}
