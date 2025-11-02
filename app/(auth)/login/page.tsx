'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuthStore } from '@/stores/authStore';
import { getRedirectPath } from '@/lib/auth/redirects';

export default function LoginPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const redirectPath = getRedirectPath(user);
      router.push(redirectPath);
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't show login if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Chinmay Astro</h1>
          <p className="text-gray-600">Your trusted astrology consultation platform</p>
        </div>

        {/* Description */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Get personalized astrology consultations through chat, audio, or video sessions.
          </p>
          <p className="text-sm text-gray-500">Sign in to book your consultation today.</p>
        </div>

        {/* Sign In Button */}
        <div className="pt-4">
          <GoogleSignInButton
            onSuccess={user => {
              console.log('Sign-in successful:', user.email);
            }}
            onError={error => {
              console.error('Sign-in error:', error);
            }}
          />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}
