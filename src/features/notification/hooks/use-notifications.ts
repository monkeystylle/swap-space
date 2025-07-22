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
        console.error('Error fetching notifications:', result.error);
        throw new Error(result.error);
      }

      return result.notifications || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // 30 seconds for real-time updates
  });
};
