import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseApp } from './config';

// Initialize Firestore
export const db: Firestore = getFirestore(firebaseApp);
