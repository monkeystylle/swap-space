import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

export const useSmartPrefetch = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const smartPrefetch = useCallback(
    (route: string, delay: number = 200) => {
      // Clear existing timeout for this route
      const existingTimeout = prefetchTimeouts.current.get(route);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        router.prefetch(route);
      }, delay);

      prefetchTimeouts.current.set(route, timeout);
    },
    [router]
  );

  const prefetchWithData = useCallback(
    async <T>(
      route: string,
      queryKey: string[],
      queryFn: () => Promise<T>,
      delay: number = 200
    ) => {
      const timeout = setTimeout(async () => {
        // Prefetch route
        router.prefetch(route);

        // Prefetch data if not already cached
        const cachedData = queryClient.getQueryData(queryKey);
        if (!cachedData) {
          queryClient.prefetchQuery({
            queryKey,
            queryFn,
            staleTime: 10 * 60 * 1000, // 10 minutes for prefetched data
          });
        }
      }, delay);

      prefetchTimeouts.current.set(route, timeout);
    },
    [router, queryClient]
  );

  // Clean up timeouts
  const cancelPrefetch = useCallback((route: string) => {
    const timeout = prefetchTimeouts.current.get(route);
    if (timeout) {
      clearTimeout(timeout);
      prefetchTimeouts.current.delete(route);
    }
  }, []);

  return {
    smartPrefetch,
    prefetchWithData,
    cancelPrefetch,
  };
};
