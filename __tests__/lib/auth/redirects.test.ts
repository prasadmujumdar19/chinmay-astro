import { describe, it, expect } from 'vitest';
import { getRedirectPath } from '@/lib/auth/redirects';
import { mockRegularUser, mockAdminUser } from '@/__tests__/fixtures/auth';
import { ROUTES } from '@/lib/constants/routes';

describe('Role-Based Redirects', () => {
  it('should return /dashboard for regular users', () => {
    const result = getRedirectPath(mockRegularUser);
    expect(result).toBe(ROUTES.DASHBOARD);
    expect(result).toBe('/dashboard');
  });

  it('should return /admin for admin users', () => {
    const result = getRedirectPath(mockAdminUser);
    expect(result).toBe(ROUTES.ADMIN);
    expect(result).toBe('/admin');
  });

  it('should return /login for null user', () => {
    const result = getRedirectPath(null);
    expect(result).toBe(ROUTES.LOGIN);
    expect(result).toBe('/login');
  });
});
