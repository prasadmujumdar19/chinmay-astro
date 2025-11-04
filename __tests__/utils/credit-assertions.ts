/**
 * Test utilities for credit assertions
 * Helper functions to verify credit balance states in tests
 */

import { expect } from 'vitest';
import type { Credits, CreditType } from '@/types/credits';

/**
 * Assert that two credit objects are equal
 */
export function expectCreditsEqual(actual: Credits, expected: Credits): void {
  expect(actual).toEqual(expected);
  expect(actual.chat).toBe(expected.chat);
  expect(actual.audio).toBe(expected.audio);
  expect(actual.video).toBe(expected.video);
}

/**
 * Assert that a specific credit type has the expected value
 */
export function expectCreditType(credits: Credits, type: CreditType, expectedValue: number): void {
  expect(credits[type]).toBe(expectedValue);
}

/**
 * Assert that all credit types are zero
 */
export function expectAllCreditsZero(credits: Credits): void {
  expect(credits.chat).toBe(0);
  expect(credits.audio).toBe(0);
  expect(credits.video).toBe(0);
}

/**
 * Assert that at least one credit type is non-zero
 */
export function expectHasAnyCredits(credits: Credits): void {
  const hasAny = credits.chat > 0 || credits.audio > 0 || credits.video > 0;
  expect(hasAny).toBe(true);
}

/**
 * Assert that a specific credit type is non-zero
 */
export function expectHasCreditsForType(credits: Credits, type: CreditType): void {
  expect(credits[type]).toBeGreaterThan(0);
}

/**
 * Assert that a specific credit type is zero
 */
export function expectNoCreditsForType(credits: Credits, type: CreditType): void {
  expect(credits[type]).toBe(0);
}

/**
 * Assert that credits object has valid structure
 */
export function expectValidCreditsStructure(credits: Credits): void {
  expect(credits).toBeDefined();
  expect(credits).toHaveProperty('chat');
  expect(credits).toHaveProperty('audio');
  expect(credits).toHaveProperty('video');
  expect(typeof credits.chat).toBe('number');
  expect(typeof credits.audio).toBe('number');
  expect(typeof credits.video).toBe('number');
}

/**
 * Assert that all credit values are non-negative
 */
export function expectNonNegativeCredits(credits: Credits): void {
  expect(credits.chat).toBeGreaterThanOrEqual(0);
  expect(credits.audio).toBeGreaterThanOrEqual(0);
  expect(credits.video).toBeGreaterThanOrEqual(0);
}
