'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getConversations,
  type ConversationWithDetails,
} from '../queries/get-conversations';

export const useConversations = (userId?: string) => {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => getConversations(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // 30 seconds for real-time feel
  });
};

export type { ConversationWithDetails };
