'use client';

import { useQuery } from '@tanstack/react-query';
import { getUnreadMessageCount } from '../queries/get-unread-count';

export const useUnreadCount = (userId?: string) => {
  return useQuery({
    queryKey: ['unreadCount', userId],
    queryFn: () => getUnreadMessageCount(userId!),
    enabled: !!userId,
    staleTime: 1000 * 10, // 10 seconds (was 30)
    refetchInterval: 1000 * 15, // 15 seconds (was 60)
  });
};
