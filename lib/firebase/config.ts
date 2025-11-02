import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { firebaseClientConfig } from './client-config';

// Firebase configuration
// NOTE: These values are safe to expose publicly (they're meant to be in browser code)
// Security is enforced via Firestore Rules and Firebase Auth, not by hiding these values
// See: https://firebase.google.com/docs/projects/learn-more#config-object-explained
const firebaseConfig = firebaseClientConfig;

// Initialize Firebase app (singleton pattern)
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
