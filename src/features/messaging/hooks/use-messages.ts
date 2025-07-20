'use client';

import { useQuery } from '@tanstack/react-query';
import { getMessagesAction } from '../actions/get-messages-action';
import type { MessageWithSender } from '../queries/get-messages';

export const useMessages = (conversationId?: string, userId?: string) => {
  return useQuery({
    queryKey: ['messages', conversationId, userId],
    queryFn: async () => {
      console.log('🔄 Messages Hook: Fetching messages via server action');
      const result = await getMessagesAction(conversationId!);

      if (result.error) {
        console.error('❌ Messages Hook: Server action error:', result.error);
        throw new Error(result.error);
      }

      console.log(
        '✅ Messages Hook: Retrieved',
        result.messages?.length,
        'messages'
      );
      return result.messages || [];
    },
    enabled: !!conversationId && !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // 30 seconds for real-time feel
  });
};

export type { MessageWithSender };
