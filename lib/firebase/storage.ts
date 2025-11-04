/**
 * Firebase Storage helper functions for persona image management
 * Reference: TDD section 10.2 "Firebase Storage Structure" (lines 8977-9030)
 * Reference: TDD section 10.3 "Image Upload Flow" (lines 9032-9107)
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload persona image to Firebase Storage
 * Path: persona-images/{userId}/{fileName}
 *
 * @param userId - User ID for organizing storage
 * @param file - Compressed image file to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Upload task for monitoring and control
 */
export function uploadPersonaImage(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): UploadTask {
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const fileName = `persona-${timestamp}.jpg`;
  const storagePath = `persona-images/${userId}/${fileName}`;

  // Create storage reference
  const storageRef = ref(storage, storagePath);

  // Start resumable upload
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: 'image/jpeg',
  });

  // Monitor upload progress
  if (onProgress) {
    uploadTask.on('state_changed', snapshot => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(Math.round(progress));
    });
  }

  return uploadTask;
}

/**
 * Get download URL for uploaded persona image
 *
 * @param uploadTask - Completed upload task
 * @returns Public download URL
 */
export async function getPersonaImageUrl(uploadTask: UploadTask): Promise<string> {
  const snapshot = await uploadTask;
  return getDownloadURL(snapshot.ref);
}

/**
 * Delete persona image from Firebase Storage
 *
 * @param storagePath - Path to image in storage (e.g., "persona-images/userId/image.jpg")
 */
export async function deletePersonaImage(storagePath: string): Promise<void> {
  if (!storagePath) {
    throw new Error('Storage path is required');
  }

  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

/**
 * Get storage path from user ID and filename
 * Used to construct the path for deletion
 *
 * @param userId - User ID
 * @param fileName - Image filename
 * @returns Storage path
 */
export function getPersonaImagePath(userId: string, fileName: string): string {
  return `persona-images/${userId}/${fileName}`;
}

/**
 * Extract filename from storage path
 *
 * @param storagePath - Full storage path
 * @returns Filename
 */
export function extractFileName(storagePath: string): string {
  return storagePath.split('/').pop() || '';
}
