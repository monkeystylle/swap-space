'use client';

import { useQuery } from '@tanstack/react-query';
import { getNotificationsAction } from '../actions/get-notifications-action';
// import type { NotificationWithDetails } from '../queries/get-notifications';

export const useNotifications = (userId?: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      const result = await getNotificationsAction();

      if (result.error) {
        // Don't log/throw auth errors to avoid noise after logout
        if (result.error.includes('logged in')) {
          return [];
        }
        console.error('Error fetching notifications:', result.error);
        throw new Error(result.error);
      }

      return result.notifications || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
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
