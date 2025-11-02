/**
 * Script to create test users in Firebase Auth for E2E testing
 *
 * Usage:
 * 1. Ensure you have FIREBASE_SERVICE_ACCOUNT_KEY in .env.local
 * 2. Run: npx tsx scripts/create-test-users.ts
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : require('../firebase-service-account-key.json'); // Fallback to local file

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

interface TestUser {
  email: string;
  password: string;
  displayName: string;
  role?: 'user' | 'admin';
}

const testUsers: TestUser[] = [
  {
    email: 'test-user@chinmayastro.com',
    password: 'TestUser123!@#', // pragma: allowlist secret
    displayName: 'Test User',
    role: 'user',
  },
  {
    email: 'admin-test@chinmayastro.com',
    password: 'AdminTest123!@#', // pragma: allowlist secret
    displayName: 'Admin Test',
    role: 'admin',
  },
];

async function createTestUser(testUser: TestUser) {
  try {
    console.log(`\n🔄 Creating user: ${testUser.email}...`);

    // Check if user already exists and delete them to ensure clean state
    let userRecord;
    try {
      const existingUser = await auth.getUserByEmail(testUser.email);
      console.log(`⚠️  User already exists: ${testUser.email}`);
      console.log(`   Deleting existing user to recreate with correct auth provider...`);

      // Delete from Firebase Auth
      await auth.deleteUser(existingUser.uid);

      // Delete from Firestore
      await firestore.collection('users').doc(existingUser.uid).delete();

      console.log(`✅ Existing user deleted`);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // User doesn't exist, which is fine
    }

    // Create fresh user with Email/Password provider
    userRecord = await auth.createUser({
      email: testUser.email,
      password: testUser.password,
      displayName: testUser.displayName,
      emailVerified: true, // Mark as verified for E2E tests
    });
    console.log(`✅ User created: ${testUser.email}`);
    console.log(`   UID: ${userRecord.uid}`);

    // Create/update Firestore user profile
    const userDocRef = firestore.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      await userDocRef.set({
        uid: userRecord.uid,
        email: testUser.email,
        displayName: testUser.displayName,
        role: testUser.role || 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionCredits: 0,
        // E2E test user data
        dateOfBirth: '1990-01-15T00:00:00Z',
        timeOfBirth: '14:30',
        placeOfBirth: 'Mumbai, India',
      });
      console.log(`✅ Firestore profile created with role: ${testUser.role}`);
    } else {
      // Update role if needed
      const existingRole = userDoc.data()?.role;
      if (existingRole !== testUser.role) {
        await userDocRef.update({
          role: testUser.role,
          // Ensure birth details exist for E2E tests
          dateOfBirth: '1990-01-15T00:00:00Z',
          timeOfBirth: '14:30',
          placeOfBirth: 'Mumbai, India',
        });
        console.log(`✅ Firestore profile updated: role ${existingRole} → ${testUser.role}`);
      } else {
        console.log(`✅ Firestore profile exists with correct role: ${testUser.role}`);
      }
    }

    return {
      success: true,
      uid: userRecord.uid,
      email: testUser.email,
    };
  } catch (error: any) {
    console.error(`❌ Error creating ${testUser.email}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🚀 Creating test users for E2E testing...\n');
  console.log('='.repeat(60));

  const results = await Promise.all(testUsers.map(createTestUser));

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Success: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);

  console.log('\n📝 Next Steps:');
  console.log('   1. Add credentials to .env.local:');
  console.log('      E2E_TEST_USER_EMAIL=test-user@chinmayastro.com');
  console.log('      E2E_TEST_USER_PASSWORD=TestUser123!@#');
  console.log('      E2E_TEST_ADMIN_EMAIL=admin-test@chinmayastro.com');
  console.log('      E2E_TEST_ADMIN_PASSWORD=AdminTest123!@#');
  console.log('   2. Run E2E tests: pnpm exec playwright test');
  console.log('\n⚠️  IMPORTANT: Keep these passwords secure and never commit them!');

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
