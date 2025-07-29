import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useRoutePrefetch = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const prefetchRoute = useCallback(
    async (
      route: string,
      queryKey?: string[],
      queryFn?: () => Promise<unknown>
    ) => {
      // Prefetch the route
      router.prefetch(route);

      // Prefetch the data if provided
      if (queryKey && queryFn) {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    },
    [router, queryClient]
  );

  // Example usage - customize based on your actual query functions:
  // const prefetchMessages = useCallback(async () => {
  //   const { getConversations } = await import('@/features/messaging/queries/get-conversations');
  //   await prefetchRoute('/messages', ['conversations'], () => getConversations(userId));
  // }, [prefetchRoute]);

  return {
    prefetchRoute,
  };
};
