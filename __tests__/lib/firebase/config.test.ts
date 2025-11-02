import { describe, it, expect } from 'vitest';
import { firebaseApp } from '@/lib/firebase/config';
import { getApps } from 'firebase/app';

describe('Firebase Configuration', () => {
  describe('Firebase app initialization', () => {
    it('should initialize Firebase app successfully', () => {
      // Verify that firebaseApp exists and is initialized
      expect(firebaseApp).toBeDefined();
      expect(firebaseApp.name).toBe('[DEFAULT]');
    });

    it('should use singleton pattern (only one app instance)', () => {
      // Verify that only one Firebase app instance exists
      const apps = getApps();
      expect(apps.length).toBe(1);
      expect(apps[0]).toBe(firebaseApp);
    });

    it('should have required Firebase configuration properties', () => {
      // Verify that firebaseApp has the required configuration
      expect(firebaseApp.options).toBeDefined();
      expect(firebaseApp.options.projectId).toBeDefined();
      expect(firebaseApp.options.apiKey).toBeDefined();
      expect(firebaseApp.options.authDomain).toBeDefined();
    });
  });
});
