import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export { onUserCreate } from './auth/onUserCreate';
export { createConsultation } from './consultations/createConsultation';
export { closeConsultation } from './consultations/closeConsultation';
