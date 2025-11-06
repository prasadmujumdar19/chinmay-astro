/**
 * CreditsCard component
 * Displays user's credit balances for chat, audio, and video consultations
 */

'use client';

import Link from 'next/link';
import { MessageSquare, Mic, Video, ShoppingCart } from 'lucide-react';
import type { Credits } from '@/types/credits';

interface CreditsCardProps {
  credits: Credits;
}

export function CreditsCard({ credits }: CreditsCardProps) {
  const hasAnyCredits = credits.chat > 0 || credits.audio > 0 || credits.video > 0;

  return (
    <div role="region" aria-label="Session Credits" className="space-y-4">
      {/* Credits Display */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Chat Credits */}
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <MessageSquare className="h-6 w-6 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Chat</p>
            <p className="text-2xl font-bold text-gray-900">{credits.chat}</p>
          </div>
        </div>

        {/* Audio Credits */}
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mic className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Audio</p>
            <p className="text-2xl font-bold text-gray-900">{credits.audio}</p>
          </div>
        </div>

        {/* Video Credits */}
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Video className="h-6 w-6 text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Video</p>
            <p className="text-2xl font-bold text-gray-900">{credits.video}</p>
          </div>
        </div>
      </div>

      {/* Buy More Button */}
      <div className="flex justify-end">
        <Link
          href="/purchase"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          Buy More Credits
        </Link>
      </div>

      {/* Zero Credits Warning */}
      {!hasAnyCredits && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            No credits available. Purchase credits to start a consultation.
          </p>
        </div>
      )}
    </div>
  );
}
