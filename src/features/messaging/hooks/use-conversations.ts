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
    staleTime: 1 * 60 * 1000, // 1 minute - conversations need to update when new messages arrive
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchInterval: 30000, // 30 seconds - good balance for conversation list updates
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: true, // Do refetch when connection is restored
  });
};

export type { ConversationWithDetails };
