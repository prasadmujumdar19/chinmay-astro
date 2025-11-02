/**
 * PersonaImageUpload component - Admin-only persona image upload
 * Reference: TDD section 10.3 "Image Upload Flow" (lines 9032-9107)
 *
 * Features:
 * - File validation (type, size)
 * - Client-side compression
 * - Upload progress tracking
 * - Cancel functionality
 */

'use client';

import { useState, useRef } from 'react';
import { compressImage, blobToFile, formatFileSize } from '@/lib/utils/imageCompression';
import { uploadPersonaImage, getPersonaImageUrl, deletePersonaImage } from '@/lib/firebase/storage';
import { updatePersonaImage } from '@/lib/api/users';
import type { UploadTask } from 'firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface PersonaImageUploadProps {
  userId: string;
  currentImagePath: string | null;
  onUploadComplete: (imageUrl: string, imagePath: string) => void;
  onError: (error: string) => void;
}

export function PersonaImageUpload({
  userId,
  currentImagePath,
  onUploadComplete,
  onError,
}: PersonaImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      onError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setIsCompressing(true);

      // Compress image
      const compressedBlob = await compressImage(selectedFile);
      const compressedFile = blobToFile(compressedBlob, `persona-${userId}.jpg`);

      setIsCompressing(false);
      setIsUploading(true);
      setUploadProgress(0);

      // Delete old image if exists
      if (currentImagePath) {
        try {
          await deletePersonaImage(currentImagePath);
        } catch (error) {
          console.warn('Failed to delete old image:', error);
          // Continue with upload even if deletion fails
        }
      }

      // Upload to Firebase Storage
      const uploadTask = uploadPersonaImage(userId, compressedFile, progress => {
        setUploadProgress(progress);
      });

      uploadTaskRef.current = uploadTask;

      // Wait for upload to complete
      await uploadTask;

      // Get download URL
      const downloadUrl = await getPersonaImageUrl(uploadTask);
      const storagePath = uploadTask.snapshot.ref.fullPath;

      // Update Firestore
      await updatePersonaImage(userId, downloadUrl, storagePath);

      // Notify parent component
      onUploadComplete(downloadUrl, storagePath);

      // Reset state
      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const err = error as Error;
      console.error('Upload error:', err);
      setIsUploading(false);
      setIsCompressing(false);
      onError(err.message || 'Failed to upload image');
    }
  };

  const handleCancel = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div>
        <label htmlFor="personaImage" className="block text-sm font-medium text-gray-700 mb-2">
          Upload Persona Image (Admin Only)
        </label>
        <input
          id="personaImage"
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading || isCompressing}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500">
          Max size: {formatFileSize(MAX_FILE_SIZE)} • Formats: JPEG, PNG, WebP
        </p>
      </div>

      {/* Selected File Info */}
      {selectedFile && !isUploading && !isCompressing && (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Compression Progress */}
      {isCompressing && (
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-700">Compressing image...</p>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Uploading...</span>
            <span className="text-gray-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isCompressing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Upload Image'}
        </button>

        {isUploading && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Cancel Upload
          </button>
        )}
      </div>
    </div>
  );
}
