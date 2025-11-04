/**
 * Test fixtures for session credits
 * Used in unit and integration tests for credits functionality
 */

import type { Credits } from '@/types/credits';

/**
 * User with zero credits across all types
 */
export const mockCreditsZero: Credits = {
  chat: 0,
  audio: 0,
  video: 0,
};

/**
 * User with some credits (chat and video only)
 */
export const mockCreditsSome: Credits = {
  chat: 3,
  audio: 0,
  video: 1,
};

/**
 * User with all credit types
 */
export const mockCreditsAll: Credits = {
  chat: 5,
  audio: 2,
  video: 3,
};

/**
 * User with only chat credits (typical scenario after first purchase)
 */
export const mockCreditsChat: Credits = {
  chat: 10,
  audio: 0,
  video: 0,
};

/**
 * User with only audio credits
 */
export const mockCreditsAudio: Credits = {
  chat: 0,
  audio: 5,
  video: 0,
};

/**
 * User with only video credits
 */
export const mockCreditsVideo: Credits = {
  chat: 0,
  audio: 0,
  video: 3,
};

/**
 * User with high credit balance (bundle purchaser)
 */
export const mockCreditsHigh: Credits = {
  chat: 12,
  audio: 6,
  video: 6,
};
