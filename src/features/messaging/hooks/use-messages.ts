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
    staleTime: 2 * 60 * 1000, // 2 minutes - keep reasonable for real-time messaging
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchInterval: 3000, // 3 seconds - restore real-time feel for messages
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: true, // Do refetch when connection is restored
  });
};

export type { MessageWithSender };
