'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser } from '@/lib/firebase/auth';

export default function DashboardPage() {
  const { user } = useAuthStore();

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

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Content</h2>
            <p className="text-gray-600">
              This is a placeholder for the user dashboard. Future features will include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>View session credits balance</li>
              <li>Purchase consultation bundles</li>
              <li>Start chat consultations</li>
              <li>Schedule audio/video sessions</li>
              <li>View consultation history</li>
              <li>Manage profile and birth details</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
