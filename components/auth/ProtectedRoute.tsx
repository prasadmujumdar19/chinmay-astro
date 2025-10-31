'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getRedirectPath } from '@/lib/auth/redirects';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait for auth to initialize

    // User not authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    // Check role-based access
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate page based on role
      const redirectPath = getRedirectPath(user);
      if (redirectPath !== pathname) {
        router.push(redirectPath);
      }
      return;
    }

    // Admin accessing /dashboard should be redirected to /admin
    if (user.role === 'admin' && pathname === '/dashboard') {
      router.push('/admin');
      return;
    }

    // Regular user accessing /admin should be redirected to /dashboard
    if (user.role === 'user' && pathname === '/admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, loading, requiredRole, router, pathname]);

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return null;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
