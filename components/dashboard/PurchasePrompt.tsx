/**
 * PurchasePrompt component
 * Displays warning prompt when user has zero credits across all types
 */

'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { Credits } from '@/types/credits';

interface PurchasePromptProps {
  credits: Credits;
}

export function PurchasePrompt({ credits }: PurchasePromptProps) {
  // Only show if ALL credit types are zero
  const hasNoCredits = credits.chat === 0 && credits.audio === 0 && credits.video === 0;

  if (!hasNoCredits) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
    >
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden="true" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-amber-800">No credits available</h3>
        <p className="mt-1 text-sm text-amber-700">
          You don&apos;t have any credits to start a consultation. Purchase credits to continue.
        </p>
        <Link
          href="/purchase"
          className="mt-3 inline-block rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          Purchase More Credits
        </Link>
      </div>
    </div>
  );
}
