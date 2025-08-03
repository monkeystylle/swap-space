'use client';

import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationsCountAction } from '../actions/get-unread-notifications-count-action';

export const useUnreadNotificationsCount = (userId?: string) => {
  return useQuery({
    queryKey: ['unreadNotificationsCount', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const result = await getUnreadNotificationsCountAction();

      if (result.error) {
        // Don't log auth errors to avoid noise after logout
        if (!result.error.includes('logged in')) {
          console.error(
            'Error fetching unread notifications count:',
            result.error
          );
        }
        return 0;
      }

      return result.count || 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: query => {
      // Only refetch if we have a valid userId and no auth errors
      if (!userId) return false;
      // Stop refetching if we got an auth error
      if (query.state.error?.message?.includes('logged in')) return false;
      return 1000 * 30; // 30 seconds for real-time updates
    },
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.message?.includes('logged in')) return false;
      return failureCount < 3;
    },
  });
};
