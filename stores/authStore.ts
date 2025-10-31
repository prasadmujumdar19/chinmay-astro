import { create } from 'zustand';
import type { UserProfile } from '@/types/auth';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) =>
    set({
      user,
      loading: false,
    }),

  setLoading: (loading) =>
    set({ loading }),

  clearAuth: () =>
    set({
      user: null,
      loading: false,
    }),
}));
