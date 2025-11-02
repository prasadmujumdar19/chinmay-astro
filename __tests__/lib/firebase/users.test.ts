import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserProfile, createUserProfile, updateUserProfile } from '@/lib/firebase/users';
import { getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn((db, collection, id) => ({ collection, id })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _seconds: 1234567890 })),
    Timestamp: class MockTimestamp {
      _seconds: number;
      _nanoseconds: number;
      constructor(seconds: number, nanoseconds: number) {
        this._seconds = seconds;
        this._nanoseconds = nanoseconds;
      }
      toDate() {
        return new Date(this._seconds * 1000);
      }
    },
  };
});

describe('User Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetch user profile', () => {
    it('should fetch user document by UID', async () => {
      const mockData = {
        uid: 'test-123',
        email: 'test@example.com',
        name: 'Test User',
        dateOfBirth: null,
        timeOfBirth: null,
        placeOfBirth: null,
        personaImageUrl: null,
        role: 'user',
        createdAt: new Timestamp(1234567890, 0),
        updatedAt: new Timestamp(1234567890, 0),
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockData,
      } as any);

      const result = await getUserProfile('test-123');

      expect(getDoc).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result?.uid).toBe('test-123');
    });

    it('should return UserProfile type with all required fields', async () => {
      const mockData = {
        uid: 'test-123',
        email: 'test@example.com',
        name: 'Test User',
        dateOfBirth: null,
        timeOfBirth: null,
        placeOfBirth: null,
        personaImageUrl: null,
        role: 'user',
        createdAt: new Timestamp(1234567890, 0),
        updatedAt: new Timestamp(1234567890, 0),
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockData,
      } as any);

      const result = await getUserProfile('test-123');

      expect(result).toHaveProperty('uid');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should return null if user not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await getUserProfile('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle Firestore errors gracefully', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(getUserProfile('test-123')).rejects.toThrow('Failed to fetch user profile');
    });
  });

  describe('Create user profile', () => {
    it('should create user document with correct schema', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);
      vi.mocked(setDoc).mockResolvedValue();

      await createUserProfile('test-123', 'test@example.com', 'Test User');

      expect(setDoc).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(callArgs.uid).toBe('test-123');
      expect(callArgs.email).toBe('test@example.com');
      expect(callArgs.name).toBe('Test User');
    });

    it('should set default role to user', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);
      vi.mocked(setDoc).mockResolvedValue();

      await createUserProfile('test-123', 'test@example.com', 'Test User');

      const callArgs = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(callArgs.role).toBe('user');
    });

    it('should include createdAt and updatedAt timestamps', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);
      vi.mocked(setDoc).mockResolvedValue();

      await createUserProfile('test-123', 'test@example.com', 'Test User');

      const callArgs = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(callArgs.createdAt).toBeDefined();
      expect(callArgs.updatedAt).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);

      await expect(createUserProfile('test-123', 'test@example.com', 'Test User')).rejects.toThrow(
        'User already exists'
      );
    });
  });

  describe('Update user profile', () => {
    it('should update user document fields', async () => {
      vi.mocked(updateDoc).mockResolvedValue();

      await updateUserProfile('test-123', { name: 'Updated Name' });

      expect(updateDoc).toHaveBeenCalledTimes(1);
    });

    it('should update updatedAt timestamp', async () => {
      vi.mocked(updateDoc).mockResolvedValue();

      await updateUserProfile('test-123', { name: 'Updated Name' });

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as any;
      expect(callArgs.updatedAt).toBeDefined();
    });

    it('should not allow role field update (security)', async () => {
      await expect(updateUserProfile('test-123', { role: 'admin' } as any)).rejects.toThrow(
        'Cannot update role field'
      );

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
});
