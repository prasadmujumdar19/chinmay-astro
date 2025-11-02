import { vi } from 'vitest';

/**
 * Mock Firebase Storage upload task
 */
export const mockUploadTask = {
  snapshot: {
    bytesTransferred: 1024,
    totalBytes: 1024,
    state: 'success',
    ref: {
      fullPath: 'persona-images/test-user-123/image.jpg',
    },
  },
  on: vi.fn((event, onProgress, onError, onComplete) => {
    if (onComplete) {
      onComplete();
    }
  }),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
};

/**
 * Mock Firebase Storage ref
 */
export const mockStorageRef = vi.fn(() => ({
  fullPath: 'persona-images/test-user-123/image.jpg',
  name: 'image.jpg',
  bucket: 'chinmay-astro-c685b.appspot.com',
}));

/**
 * Mock uploadBytesResumable
 */
export const mockUploadBytesResumable = vi.fn(() => mockUploadTask);

/**
 * Mock getDownloadURL
 */
export const mockGetDownloadURL = vi.fn(() =>
  Promise.resolve(
    'https://firebasestorage.googleapis.com/v0/b/chinmay-astro-c685b.appspot.com/o/persona-images%2Ftest-user-123%2Fimage.jpg?alt=media'
  )
);

/**
 * Mock deleteObject
 */
export const mockDeleteObject = vi.fn(() => Promise.resolve());

/**
 * Mock ref function
 */
export const mockRef = vi.fn((storage, path) => ({
  fullPath: path,
  name: path.split('/').pop(),
  bucket: 'chinmay-astro-c685b.appspot.com',
}));

/**
 * Reset all storage mocks
 */
export const resetStorageMocks = () => {
  mockStorageRef.mockClear();
  mockUploadBytesResumable.mockClear();
  mockGetDownloadURL.mockClear();
  mockDeleteObject.mockClear();
  mockRef.mockClear();
};
