'use client';

import { useQuery } from '@tanstack/react-query';
import { getUnreadMessageCount } from '../queries/get-unread-count';

export const useUnreadCount = (userId?: string) => {
  return useQuery({
    queryKey: ['unreadCount', userId],
    queryFn: () => getUnreadMessageCount(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - unread counts change more frequently
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: 2 * 60 * 1000, // 2 minutes instead of 1 minute - less aggressive
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: true, // Do refetch when connection is restored
  });
};
