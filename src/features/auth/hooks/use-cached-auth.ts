import { useQuery } from '@tanstack/react-query';
import { getAuth } from '../queries/get-auth';

/**
 * Optimized auth hook using React Query for better caching and performance.
 * Use this instead of useAuth when you need better caching behavior,
 * especially in pages that users navigate back to frequently.
 */
const useCachedAuth = () => {
  const { data, isLoading, isFetched } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const result = await getAuth();
      return result;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - auth data should be cached longer
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    retry: false, // Don't retry auth failures automatically
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isLoading,
    isFetched,
  };
};

export { useCachedAuth };
