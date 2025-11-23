import { isToday, isYesterday, format } from 'date-fns';

/**
 * Chat Utility Functions
 *
 * Reusable utilities for chat functionality including message formatting and validation
 *
 * Reference: TDD section 12.1 "Chat Utilities" (lines 10900-11000)
 */

/**
 * Maximum message length in characters
 */
export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Character count threshold for showing warning
 */
export const MESSAGE_LENGTH_WARNING_THRESHOLD = 1900;

/**
 * Validate message text
 *
 * @param text - Message text to validate
 * @returns Error message if invalid, null if valid
 */
export function validateMessage(text: string): string | null {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return 'Message cannot be empty';
  }

  if (trimmedText.length > MAX_MESSAGE_LENGTH) {
    return `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`;
  }

  return null;
}

/**
 * Format timestamp for message display
 *
 * @param date - Date to format
 * @returns Formatted timestamp string
 *
 * Examples:
 * - Today, 2:30 PM
 * - Yesterday, 10:15 AM
 * - Jan 15, 3:45 PM
 */
export function formatMessageTimestamp(date: Date): string {
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, h:mm a');
  }
}

/**
 * Check if character count is approaching limit
 *
 * @param length - Current message length
 * @returns True if approaching limit (>= WARNING_THRESHOLD)
 */
export function isApproachingCharacterLimit(length: number): boolean {
  return length >= MESSAGE_LENGTH_WARNING_THRESHOLD;
}

/**
 * Truncate text to maximum length
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length (defaults to MAX_MESSAGE_LENGTH)
 * @returns Truncated text
 */
export function truncateMessage(text: string, maxLength: number = MAX_MESSAGE_LENGTH): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}
