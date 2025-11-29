/**
 * User sessions page route
 * Feature 6 - Task 4.0.6
 */

'use client';

import { SessionsPage } from '@/components/sessions/SessionsPage';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SessionsRoute() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SessionsPage userId={user.uid} />
    </div>
  );
}
