import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { mockRegularUser } from '../fixtures/auth';

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setLoading(true);
  });

  describe('Initialization', () => {
    it('should initialize with null user and loading true', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(true);
    });

    it('should provide setUser, setLoading, clearAuth actions', () => {
      const state = useAuthStore.getState();
      expect(state.setUser).toBeDefined();
      expect(state.setLoading).toBeDefined();
      expect(state.clearAuth).toBeDefined();
      expect(typeof state.setUser).toBe('function');
      expect(typeof state.setLoading).toBe('function');
      expect(typeof state.clearAuth).toBe('function');
    });
  });

  describe('setUser action', () => {
    it('should update user state with UserProfile object', () => {
      useAuthStore.getState().setUser(mockRegularUser);
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockRegularUser);
    });

    it('should set loading to false after setting user', () => {
      useAuthStore.getState().setUser(mockRegularUser);
      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
    });
  });

  describe('clearAuth action', () => {
    it('should set user to null', () => {
      // First set a user
      useAuthStore.getState().setUser(mockRegularUser);
      // Then clear
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should set loading to false', () => {
      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
    });
  });
});
