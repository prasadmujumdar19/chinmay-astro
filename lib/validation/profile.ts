/**
 * Profile validation schemas
 * Reference: CLAUDE.md "TypeScript Best Practices" (lines 47-88)
 *
 * Centralized Zod schemas for profile-related forms
 */

import { z } from 'zod';

/**
 * Birth details validation schema
 * Used by BirthDetailsForm component
 */
export const birthDetailsSchema = z.object({
  dateOfBirth: z.date({
    message: 'Date of birth is required',
  }),
  timeOfBirth: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format (24-hour)'),
  placeOfBirth: z.string().min(1, 'Place of birth is required').max(100, 'Too long'),
});

/**
 * TypeScript type inferred from birth details schema
 */
export type BirthDetailsFormData = z.infer<typeof birthDetailsSchema>;

/**
 * Persona image upload validation schema
 * Used by PersonaImageUpload component (admin)
 */
export const personaImageSchema = z.object({
  file: z
    .instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});

/**
 * TypeScript type inferred from persona image schema
 */
export type PersonaImageFormData = z.infer<typeof personaImageSchema>;
