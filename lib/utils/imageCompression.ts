/**
 * Client-side image compression utilities
 * Reference: TDD section 10.3 "Image Upload Flow" (lines 9032-9107)
 *
 * Compresses images to reduce upload size and storage costs
 * Target: Max 1024x1024 pixels, 80% quality, JPEG format
 */

const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;
const QUALITY = 0.8; // 80% quality

/**
 * Compress an image file using HTML5 Canvas API
 *
 * @param file - Original image file
 * @returns Compressed image as Blob
 */
export async function compressImage(file: File): Promise<Blob> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Create image element
  const image = await loadImage(file);

  // Calculate new dimensions (maintain aspect ratio)
  const { width, height } = calculateDimensions(image.width, image.height);

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image to canvas
  ctx.drawImage(image, 0, 0, width, height);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      'image/jpeg',
      QUALITY
    );
  });
}

/**
 * Load image file into HTMLImageElement
 *
 * @param file - Image file to load
 * @returns Promise that resolves to loaded image
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        image.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 * Scales down if image exceeds max dimensions
 *
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @returns New dimensions
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Only resize if image exceeds max dimensions
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const aspectRatio = width / height;

    if (width > height) {
      // Landscape orientation
      width = MAX_WIDTH;
      height = Math.round(MAX_WIDTH / aspectRatio);
    } else {
      // Portrait orientation
      height = MAX_HEIGHT;
      width = Math.round(MAX_HEIGHT * aspectRatio);
    }
  }

  return { width, height };
}

/**
 * Convert Blob to File
 *
 * @param blob - Blob to convert
 * @param fileName - Desired file name
 * @returns File object
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

/**
 * Get human-readable file size
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
