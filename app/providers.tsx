'use client';

import { useAuthObserver } from '@/hooks/useAuthObserver';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize auth observer
  useAuthObserver();

  return <>{children}</>;
}
