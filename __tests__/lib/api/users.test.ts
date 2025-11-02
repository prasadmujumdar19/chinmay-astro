import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProfile, updateUserProfile, updatePersonaImage } from '@/lib/api/users';
import { mockUpdateDoc, mockGetDoc, mockDoc } from '@/__tests__/mocks/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
  const mocks = await import('@/__tests__/mocks/firestore');
  return {
    getFirestore: vi.fn(),
    doc: mocks.mockDoc,
    getDoc: mocks.mockGetDoc,
    updateDoc: mocks.mockUpdateDoc,
    collection: vi.fn(),
    Timestamp: {
      now: () => ({ toDate: () => new Date() }),
      fromDate: (date: Date) => ({ toDate: () => date }),
    },
  };
});

describe('User Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile from Firestore', async () => {
      const profile = await getUserProfile('test-user-123');

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-123');
      expect(mockGetDoc).toHaveBeenCalled();
      expect(profile).toBeDefined();
      expect(profile?.uid).toBe('test-user-123');
    });

    it('should return null if user does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => undefined,
        id: 'test-user-123',
        ref: {},
      });

      const profile = await getUserProfile('non-existent-user');

      expect(profile).toBeNull();
    });

    it('should handle Firestore errors', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(getUserProfile('test-user-123')).rejects.toThrow('Firestore error');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile in Firestore', async () => {
      const updates = {
        dateOfBirth: new Date('1995-05-20'),
        timeOfBirth: '10:00',
        placeOfBirth: 'Delhi, India',
      };

      await updateUserProfile('test-user-123', updates);

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.anything(),
        })
      );
    });

    it('should handle update errors', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        updateUserProfile('test-user-123', { placeOfBirth: 'New Place' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('updatePersonaImage', () => {
    it('should update persona image URL and path in Firestore', async () => {
      const imageUrl =
        'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/o/image.jpg?alt=media';
      const imagePath = 'persona-images/test-user-123/image.jpg';

      await updatePersonaImage('test-user-123', imageUrl, imagePath);

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          personaImageUrl: imageUrl,
          personaImagePath: imagePath,
          personaUploadedAt: expect.anything(),
          updatedAt: expect.anything(),
        })
      );
    });

    it('should handle image update errors', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Image update failed'));

      await expect(updatePersonaImage('test-user-123', 'url', 'path')).rejects.toThrow(
        'Image update failed'
      );
    });
  });
});
