import type { UserProfile } from '@/types/auth';

/**
 * Get redirect path based on user role
 * @param user - UserProfile or null
 * @returns Redirect path
 */
export function getRedirectPath(user: UserProfile | null): string {
  if (!user) {
    return '/login';
  }

  if (user.role === 'admin') {
    return '/admin';
  }

  return '/dashboard';
}
