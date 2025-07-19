'use client';

import { useQuery } from '@tanstack/react-query';
import { getMessages, type MessageWithSender } from '../queries/get-messages';

export const useMessages = (conversationId?: string, userId?: string) => {
  return useQuery({
    queryKey: ['messages', conversationId, userId],
    queryFn: () => getMessages(conversationId!, userId!),
    enabled: !!conversationId && !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // 30 seconds for real-time feel
  });
};

export type { MessageWithSender };
