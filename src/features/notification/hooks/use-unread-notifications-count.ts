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
        console.error(
          'Error fetching unread notifications count:',
          result.error
        );
        return 0;
      }

      return result.count || 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // 30 seconds for real-time updates
  });
};
