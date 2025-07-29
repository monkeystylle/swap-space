'use client';

import { useAppPrefetch } from '@/hooks/use-app-prefetch';

export const AppPrefetchInitializer = () => {
  useAppPrefetch();
  return null; // This component doesn't render anything
};
