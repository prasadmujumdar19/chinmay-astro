/**
 * Unit tests for credit validation utilities
 */

import { describe, it, expect } from 'vitest';
import { hasSufficientCredits, canStartConsultation } from '@/lib/credits/validation';
import {
  mockCreditsAll,
  mockCreditsZero,
  mockCreditsSome,
  mockCreditsChat,
} from '../../fixtures/credits';

describe('hasSufficientCredits', () => {
  it('should return true when user has credits for the type', () => {
    // mockCreditsAll: { chat: 5, audio: 2, video: 3 }
    expect(hasSufficientCredits(mockCreditsAll, 'chat')).toBe(true);
    expect(hasSufficientCredits(mockCreditsAll, 'audio')).toBe(true);
    expect(hasSufficientCredits(mockCreditsAll, 'video')).toBe(true);
  });

  it('should return false when user has zero credits for the type', () => {
    // mockCreditsZero: { chat: 0, audio: 0, video: 0 }
    expect(hasSufficientCredits(mockCreditsZero, 'chat')).toBe(false);
    expect(hasSufficientCredits(mockCreditsZero, 'audio')).toBe(false);
    expect(hasSufficientCredits(mockCreditsZero, 'video')).toBe(false);
  });

  it('should return correct value for partial credits', () => {
    // mockCreditsSome: { chat: 3, audio: 0, video: 1 }
    expect(hasSufficientCredits(mockCreditsSome, 'chat')).toBe(true);
    expect(hasSufficientCredits(mockCreditsSome, 'audio')).toBe(false);
    expect(hasSufficientCredits(mockCreditsSome, 'video')).toBe(true);
  });

  it('should return true for single credit remaining', () => {
    const singleCredit = { chat: 1, audio: 0, video: 0 };
    expect(hasSufficientCredits(singleCredit, 'chat')).toBe(true);
  });
});

describe('canStartConsultation', () => {
  it('should return true when user has credits for consultation type', () => {
    expect(canStartConsultation(mockCreditsAll, 'chat')).toBe(true);
    expect(canStartConsultation(mockCreditsAll, 'audio')).toBe(true);
    expect(canStartConsultation(mockCreditsAll, 'video')).toBe(true);
  });

  it('should return false when user has zero credits for consultation type', () => {
    expect(canStartConsultation(mockCreditsZero, 'chat')).toBe(false);
    expect(canStartConsultation(mockCreditsZero, 'audio')).toBe(false);
    expect(canStartConsultation(mockCreditsZero, 'video')).toBe(false);
  });

  it('should return correct value for partial credits', () => {
    // mockCreditsSome: { chat: 3, audio: 0, video: 1 }
    expect(canStartConsultation(mockCreditsSome, 'chat')).toBe(true);
    expect(canStartConsultation(mockCreditsSome, 'audio')).toBe(false);
    expect(canStartConsultation(mockCreditsSome, 'video')).toBe(true);
  });

  it('should allow starting consultation with 1 credit', () => {
    const singleCredit = { chat: 1, audio: 0, video: 0 };
    expect(canStartConsultation(singleCredit, 'chat')).toBe(true);
  });

  it('should prevent starting consultation with 0 credits', () => {
    expect(canStartConsultation(mockCreditsChat, 'audio')).toBe(false);
    expect(canStartConsultation(mockCreditsChat, 'video')).toBe(false);
  });

  it('should handle all credit types independently', () => {
    // Chat credits should not allow audio/video consultations
    expect(canStartConsultation(mockCreditsChat, 'chat')).toBe(true);
    expect(canStartConsultation(mockCreditsChat, 'audio')).toBe(false);
    expect(canStartConsultation(mockCreditsChat, 'video')).toBe(false);
  });
});
