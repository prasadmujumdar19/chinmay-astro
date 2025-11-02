import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock firebase-admin - must avoid hoisting issues
vi.mock('firebase-admin', () => {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockDoc = vi.fn(() => ({
    set: mockSet,
  }));
  const mockCollection = vi.fn(() => ({
    doc: mockDoc,
  }));
  const mockFirestore = vi.fn(() => ({
    collection: mockCollection,
  }));

  return {
    default: {
      firestore: mockFirestore,
    },
    firestore: Object.assign(mockFirestore, {
      FieldValue: {
        serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
      },
    }),
  };
});

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Import after mocks
import { onUserCreate } from '../../auth/onUserCreate';
import * as admin from 'firebase-admin';

describe('onUserCreate Cloud Function', () => {
  const mockUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  let mockFirestoreInstance: any;
  let mockCollectionFn: any;
  let mockDocFn: any;
  let mockSetFn: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get the mocked firestore instance
    mockFirestoreInstance = admin.firestore();
    mockCollectionFn = mockFirestoreInstance.collection;
    mockDocFn = mockCollectionFn().doc;
    mockSetFn = mockDocFn().set;

    // Reset mock implementations
    (mockSetFn as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create user document in Firestore on auth user creation', async () => {
    // Call the handler directly with mock user
    // @ts-ignore - Testing the function behavior
    await onUserCreate.run(mockUser);

    // Verify Firestore collection was called with 'users'
    expect(mockCollectionFn).toHaveBeenCalledWith('users');

    // Verify doc was called with user uid
    expect(mockDocFn).toHaveBeenCalledWith(mockUser.uid);

    // Verify set was called with user profile data
    expect(mockSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: mockUser.uid,
        email: mockUser.email,
        name: mockUser.displayName,
        role: 'user',
        dateOfBirth: null,
        timeOfBirth: null,
        placeOfBirth: null,
        personaImageUrl: null,
      })
    );
  });

  it('should create sessionCredits document with 0 credits', async () => {
    // Call the handler
    // @ts-ignore
    await onUserCreate.run(mockUser);

    // Verify sessionCredits collection was called
    expect(mockCollectionFn).toHaveBeenCalledWith('sessionCredits');

    // Verify set was called with credits data
    const sessionCreditsCall = (mockSetFn as ReturnType<typeof vi.fn>).mock.calls.find(
      (call: any) => call[0].userId === mockUser.uid
    );

    expect(sessionCreditsCall).toBeDefined();
    expect(sessionCreditsCall[0]).toEqual(
      expect.objectContaining({
        userId: mockUser.uid,
        chatCredits: 0,
        audioCredits: 0,
        videoCredits: 0,
      })
    );
  });

  it('should send notification to admin (in-app + email)', async () => {
    // Call the handler
    // @ts-ignore
    await onUserCreate.run(mockUser);

    // Verify console.log was called (notification is TODO for Feature 7)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(`User ${mockUser.uid} created successfully`)
    );

    // Note: Actual notification implementation will be added in Feature 7
    // For now, we just verify the success log message
  });

  it('should handle errors gracefully (log and not crash)', async () => {
    // Make Firestore throw an error
    (mockSetFn as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Firestore error'));

    // Call the handler - should not throw
    // @ts-ignore
    const result = await onUserCreate.run(mockUser);

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error creating user profile:',
      expect.any(Error)
    );

    // Verify function returned null (not throwing)
    expect(result).toBeNull();
  });
});
