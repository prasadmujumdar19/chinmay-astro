import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { mockRegularUser, mockAdminUser } from '../../fixtures/auth';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname(),
}));

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock redirects
vi.mock('@/lib/auth/redirects', () => ({
  getRedirectPath: vi.fn((user: { role: string }) => {
    return user.role === 'admin' ? '/admin' : '/dashboard';
  }),
}));

// Import after mocks
import { useAuthStore } from '@/stores/authStore';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
  });

  it('should show loading spinner while auth is loading', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: true,
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show loading spinner (check for the animate-spin class)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockRegularUser,
      loading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to /login when user is not authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith('/login');

    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect admin to /admin if accessing /dashboard', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockAdminUser,
      loading: false,
    });

    mockPathname.mockReturnValue('/dashboard');

    render(
      <ProtectedRoute>
        <div>Dashboard Content</div>
      </ProtectedRoute>
    );

    // Should redirect admin to /admin
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('should redirect regular user to /dashboard if accessing /admin', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockRegularUser,
      loading: false,
    });

    mockPathname.mockReturnValue('/admin');

    render(
      <ProtectedRoute>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    // Should redirect regular user to /dashboard
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
