'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser } from '@/lib/firebase/auth';
import { CreditsCard } from '@/components/dashboard/CreditsCard';
import { PurchasePrompt } from '@/components/dashboard/PurchasePrompt';
import { useCredits } from '@/hooks/useCredits';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { credits, isLoading } = useCredits();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
                <p className="text-gray-600 mt-1">User Dashboard</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Session Credits */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Session Credits</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
              </div>
            ) : credits ? (
              <>
                <PurchasePrompt credits={credits} />
                <div
                  className={
                    credits.chat === 0 && credits.audio === 0 && credits.video === 0 ? 'mt-4' : ''
                  }
                >
                  <CreditsCard credits={credits} />
                </div>
              </>
            ) : (
              <p className="text-gray-600">Unable to load credits. Please refresh the page.</p>
            )}
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <li>
                <Link
                  href="/purchase"
                  className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900">Purchase Credits</h3>
                  <p className="mt-1 text-sm text-gray-600">Buy consultation bundles</p>
                </Link>
              </li>
              <li>
                <Link
                  href="/consultations"
                  className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900">Start Consultation</h3>
                  <p className="mt-1 text-sm text-gray-600">Chat, audio, or video sessions</p>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
