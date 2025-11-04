/**
 * BirthDetailsForm component - Edit user birth details
 * Reference: TDD section 5.1.2 "Collection: users" (lines 2845-2949)
 *
 * Uses React Hook Form + Zod validation
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BirthDetails } from '@/types/user';
import { birthDetailsSchema, type BirthDetailsFormData } from '@/lib/validation/profile';

interface BirthDetailsFormProps {
  initialData: BirthDetails;
  onSubmit: (data: BirthDetails) => Promise<void>;
  onCancel?: () => void;
}

export function BirthDetailsForm({ initialData, onSubmit, onCancel }: BirthDetailsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BirthDetailsFormData>({
    resolver: zodResolver(birthDetailsSchema),
    defaultValues: {
      dateOfBirth: initialData.dateOfBirth,
      timeOfBirth: initialData.timeOfBirth,
      placeOfBirth: initialData.placeOfBirth,
    },
  });

  const onFormSubmit = async (data: BirthDetailsFormData) => {
    await onSubmit(data);
  };

  // Convert Date to YYYY-MM-DD for input field
  const dateValue = initialData.dateOfBirth
    ? initialData.dateOfBirth.toISOString().split('T')[0]
    : '';

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Date of Birth */}
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          id="dateOfBirth"
          type="date"
          defaultValue={dateValue}
          {...register('dateOfBirth', {
            valueAsDate: true,
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-invalid={errors.dateOfBirth ? 'true' : 'false'}
          aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
        />
        {errors.dateOfBirth && (
          <p id="dateOfBirth-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.dateOfBirth.message}
          </p>
        )}
      </div>

      {/* Time of Birth */}
      <div>
        <label htmlFor="timeOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
          Time of Birth (24-hour format) <span className="text-red-500">*</span>
        </label>
        <input
          id="timeOfBirth"
          type="time"
          {...register('timeOfBirth')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-invalid={errors.timeOfBirth ? 'true' : 'false'}
          aria-describedby={errors.timeOfBirth ? 'timeOfBirth-error' : undefined}
        />
        {errors.timeOfBirth && (
          <p id="timeOfBirth-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.timeOfBirth.message}
          </p>
        )}
      </div>

      {/* Place of Birth */}
      <div>
        <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
          Place of Birth <span className="text-red-500">*</span>
        </label>
        <input
          id="placeOfBirth"
          type="text"
          {...register('placeOfBirth')}
          placeholder="e.g., Mumbai, India"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-invalid={errors.placeOfBirth ? 'true' : 'false'}
          aria-describedby={errors.placeOfBirth ? 'placeOfBirth-error' : undefined}
        />
        {errors.placeOfBirth && (
          <p id="placeOfBirth-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.placeOfBirth.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
