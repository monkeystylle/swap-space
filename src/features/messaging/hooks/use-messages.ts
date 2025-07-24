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
    staleTime: 2 * 60 * 1000, // 2 minutes (was 30 seconds)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchInterval: 3000, // 🎯 Change from 30000 to 3000 (3 seconds)
  });
};

export type { MessageWithSender };
