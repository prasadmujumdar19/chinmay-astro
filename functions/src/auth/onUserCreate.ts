import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Cloud Function triggered when a new user is created via Firebase Auth
 * Creates user profile and session credits documents
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  try {
    const db = admin.firestore();

    // Create user profile document with all required fields
    await db.collection('users').doc(uid).set({
      uid,
      email: email || '',
      name: displayName || email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
      dateOfBirth: null,
      timeOfBirth: null,
      placeOfBirth: null,
      personaImageUrl: null,
      personaImagePath: null,
      personaUploadedAt: null,
      role: 'user', // Default role
      credits: { chat: 0, audio: 0, video: 0 },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      agreedToTermsAt: admin.firestore.FieldValue.serverTimestamp(),
      agreedToPrivacyAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create session credits document with 0 credits
    await db.collection('sessionCredits').doc(uid).set({
      userId: uid,
      chatCredits: 0,
      audioCredits: 0,
      videoCredits: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // TODO: Send notification to admin (will implement in Feature 7)
    console.log(`User ${uid} created successfully with profile and credits`);

    return null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    // Don't throw - log and continue to prevent user creation failure
    return null;
  }
});
