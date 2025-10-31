import type { UserProfile } from '@/types/auth';
import { ROUTES } from '@/lib/constants/routes';

/**
 * Get redirect path based on user role
 * @param user - UserProfile or null
 * @returns Redirect path (/login, /dashboard, or /admin)
 */
export function getRedirectPath(user: UserProfile | null): string {
  if (!user) {
    return ROUTES.LOGIN;
  }

  if (user.role === 'admin') {
    return ROUTES.ADMIN;
  }

  return ROUTES.DASHBOARD;
}
