import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/(dashboard)/profile/page';
import { mockUserProfile, mockUserWithPersona } from '@/__tests__/fixtures/profile';

// Mock the useAuthStore hook
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUserProfile,
    loading: false,
  })),
}));

// Mock the getUserProfile function
vi.mock('@/lib/api/users', () => ({
  getUserProfile: vi.fn(() => Promise.resolve(mockUserProfile)),
  updateUserProfile: vi.fn(() => Promise.resolve()),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render profile page with user data', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(mockUserProfile.name)).toBeInTheDocument();
      expect(screen.getByText(mockUserProfile.email)).toBeInTheDocument();
    });
  });

  it('should display birth details', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/Mumbai, India/i)).toBeInTheDocument();
      expect(screen.getByText(/14:30/i)).toBeInTheDocument();
    });
  });

  it('should show placeholder when persona image is null', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      const image = screen.getByAltText(/persona/i);
      expect(image).toBeInTheDocument();
      expect(image.getAttribute('src')).toContain('placeholder');
    });
  });

  it('should show persona image when available', async () => {
    const { useAuthStore } = await import('@/stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUserWithPersona,
      loading: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      clearAuth: vi.fn(),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      const image = screen.getByAltText(/persona/i);
      expect(image).toBeInTheDocument();
      expect(image.getAttribute('src')).toContain('persona-images');
    });
  });

  it('should show loading state while fetching profile', async () => {
    const { useAuthStore } = await import('@/stores/authStore');
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      loading: true,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      clearAuth: vi.fn(),
    });

    render(<ProfilePage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
