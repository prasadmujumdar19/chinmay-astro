/**
 * Credit validation utilities
 * Helper functions for checking credit availability
 */

import type { Credits, CreditType } from '@/types/credits';

/**
 * Check if user has sufficient credits for a given type
 * @param credits - User's credit balance
 * @param type - Type of credit to check (chat, audio, video)
 * @returns True if user has at least 1 credit of the specified type
 */
export function hasSufficientCredits(credits: Credits, type: CreditType): boolean {
  return credits[type] > 0;
}

/**
 * Check if user can start a consultation of the given type
 * @param credits - User's credit balance
 * @param type - Type of consultation (chat, audio, video)
 * @returns True if user has at least 1 credit to start consultation
 */
export function canStartConsultation(credits: Credits, type: CreditType): boolean {
  return hasSufficientCredits(credits, type);
}
