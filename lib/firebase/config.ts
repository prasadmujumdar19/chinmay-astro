import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';

// Firebase configuration
// TODO: Move to environment variables once Next.js 16 + Turbopack env loading is fixed
const firebaseConfig = {
  apiKey: 'AIzaSyC-IQNeWu8Fs_ktyxtQGLkAG_mjVA470_I',
  authDomain: 'chinmay-astro-c685b.firebaseapp.com',
  projectId: 'chinmay-astro-c685b',
  storageBucket: 'chinmay-astro-c685b.firebasestorage.app',
  messagingSenderId: '300957221965',
  appId: '1:300957221965:web:20545cb5811a4e37784804',
};

// Initialize Firebase app (singleton pattern)
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
