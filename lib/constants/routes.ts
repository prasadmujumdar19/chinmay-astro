/**
 * Application route constants
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
} as const;

/**
 * Route type based on ROUTES constant
 */
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
