/**
 * Date formatting utilities
 * Feature 6 - Phase 5.0 Task 5.0.1
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Format Firestore Timestamp to readable date string
 * @param timestamp - Firestore Timestamp or null
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or 'Not scheduled' if timestamp is null
 */
export function formatTimestamp(
  timestamp: Timestamp | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!timestamp) return 'Not scheduled';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Format Firestore Timestamp to short date string (for lists/cards)
 * @param timestamp - Firestore Timestamp
 * @returns Short formatted date string
 */
export function formatShortDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format Date object to ISO date string for input fields
 * @param date - JavaScript Date object
 * @returns ISO date string (YYYY-MM-DDTHH:mm)
 */
export function toISOInputFormat(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @returns true if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}
