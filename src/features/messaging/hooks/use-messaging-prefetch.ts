'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getConversationsAction } from '../actions/get-conversations-action';
import { getMessagesAction } from '../actions/get-messages-action';
import { messagesPath } from '@/paths';

interface UseMessagingPrefetchProps {
  userId?: string;
}

export const useMessagingPrefetch = ({ userId }: UseMessagingPrefetchProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Prefetch conversations data
  const prefetchConversations = useCallback(async () => {
    if (!userId) return;

    // First prefetch the route
    router.prefetch(messagesPath());

    // Then prefetch the conversations data
    await queryClient.prefetchQuery({
      queryKey: ['conversations', userId],
      queryFn: async () => {
        console.log('🔄 Prefetch: Fetching conversations via server action');
        const result = await getConversationsAction(userId);
        if (result.error) {
          throw new Error(result.error);
        }
        return result.conversations || [];
      },
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    });

    console.log('✅ Prefetch: Conversations data prefetched');
  }, [userId, queryClient, router]);

  // Prefetch messages for multiple conversations
  const prefetchMessagesForConversations = useCallback(
    async (conversationIds: string[]) => {
      if (!userId || conversationIds.length === 0) return;

      const prefetchPromises = conversationIds.map(conversationId =>
        queryClient.prefetchQuery({
          queryKey: ['messages', conversationId, userId],
          queryFn: async () => {
            const result = await getMessagesAction(conversationId);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.messages || [];
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
        })
      );

      await Promise.all(prefetchPromises);
      console.log(
        `✅ Prefetch: Messages prefetched for ${conversationIds.length} conversations`
      );
    },
    [userId, queryClient]
  );

  // Smart prefetch for most important conversations
  const smartPrefetchMessages = useCallback(
    async (
      conversations: {
        id: string;
        isArchived: boolean;
        unreadCount: number;
        lastMessage?: { createdAt: string };
      }[]
    ) => {
      if (!userId || conversations.length === 0) return;

      // Prioritize conversations with unread messages or recent activity
      const priorityConversations = conversations
        .filter(conv => !conv.isArchived)
        .sort((a, b) => {
          // Sort by: unread count (desc), then last message time (desc)
          if (a.unreadCount !== b.unreadCount) {
            return b.unreadCount - a.unreadCount;
          }
          if (a.lastMessage && b.lastMessage) {
            return (
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime()
            );
          }
          return 0;
        })
        .slice(0, 3) // Only prefetch top 3 conversations
        .map(conv => conv.id);

      if (priorityConversations.length > 0) {
        await prefetchMessagesForConversations(priorityConversations);
      }
    },
    [userId, prefetchMessagesForConversations]
  );

  // Combined prefetch for messages page - conversations + priority messages
  const prefetchMessagesPage = useCallback(async () => {
    if (!userId) return;

    try {
      // First prefetch conversations
      await prefetchConversations();

      // Get the current conversations from cache to prefetch priority messages
      const cachedConversations = queryClient.getQueryData([
        'conversations',
        userId,
      ]) as {
        id: string;
        isArchived: boolean;
        unreadCount: number;
        lastMessage?: { createdAt: string };
      }[];
      if (cachedConversations && cachedConversations.length > 0) {
        await smartPrefetchMessages(cachedConversations);
      }
    } catch (error) {
      console.error(
        '❌ Prefetch: Error prefetching messages page data:',
        error
      );
    }
  }, [userId, prefetchConversations, smartPrefetchMessages, queryClient]);

  return {
    prefetchConversations,
    prefetchMessagesForConversations,
    smartPrefetchMessages,
    prefetchMessagesPage,
  };
};
