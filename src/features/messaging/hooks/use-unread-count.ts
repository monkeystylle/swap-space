'use client';

import { useQuery } from '@tanstack/react-query';
import { getUnreadMessageCount } from '../queries/get-unread-count';

export const useUnreadCount = (userId?: string) => {
  return useQuery({
    queryKey: ['unreadCount', userId],
    queryFn: () => getUnreadMessageCount(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute
  });
};
