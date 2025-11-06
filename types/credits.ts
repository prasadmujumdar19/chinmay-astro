/**
 * Type definitions for session credits
 */

/**
 * Session credits for different consultation types
 * - chat: Credits for chat consultations
 * - audio: Credits for audio consultations
 * - video: Credits for video consultations
 */
export interface Credits {
  chat: number;
  audio: number;
  video: number;
}

/**
 * Type of credit (chat, audio, or video)
 */
export type CreditType = 'chat' | 'audio' | 'video';
