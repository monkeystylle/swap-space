'use client';

import { useQuery } from '@tanstack/react-query';
import { getConversationsAction } from '../actions/get-conversations-action';
import type { ConversationWithDetails } from '../queries/get-conversations';

export const useConversations = (userId?: string) => {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      console.log('🔄 Hook: Fetching conversations via server action');
      const result = await getConversationsAction(userId!);

      if (result.error) {
        console.error('❌ Hook: Server action error:', result.error);
        throw new Error(result.error);
      }

      console.log(
        '✅ Hook: Retrieved',
        result.conversations?.length,
        'conversations'
      );
      return result.conversations || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // 30 seconds for real-time feel
  });
};

export type { ConversationWithDetails };
