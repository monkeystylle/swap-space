'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ConversationList } from '@/features/messaging/components/conversation-list';
import { ChatInterface } from '@/features/messaging/components/chat-interface';
import { useConversations } from '@/features/messaging/hooks/use-conversations';
import { useMessages } from '@/features/messaging/hooks/use-messages';
import { sendMessage } from '@/features/messaging/actions/send-message';
import { archiveConversation } from '@/features/messaging/actions/archive-conversation';
import { markMessagesAsRead } from '@/features/messaging/actions/mark-messages-read';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { signInPath } from '@/paths';
import { v4 as uuidv4 } from 'uuid';

export function MessagesPageContent() {
  const { user, isFetched } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();

  // State to track selected conversation and other user details
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');

  // State to track the other user in the selected conversation
  const [selectedOtherUser, setSelectedOtherUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  // State to track if we've tried refetching conversations
  const [hasTriedRefetch, setHasTriedRefetch] = useState(false);

  // Fetch conversations for the current user
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useConversations(user?.id);

  // Fetch messages for the selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversationId,
    user?.id
  );

  // Send message mutation with proper optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => sendMessage(conversationId, content),

    onMutate: async ({ conversationId, content }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: ['messages', conversationId, user?.id],
      });

      // Get the current messages from cache
      const previousMessages = queryClient.getQueryData([
        'messages',
        conversationId,
        user?.id,
      ]);

      // Create optimistic message - Stage 1: Show only "Sending..."
      const optimisticMessage = {
        id: uuidv4(),
        content: content.trim(), // Store the actual content but won't show initially
        createdAt: new Date().toISOString(),
        senderId: user!.id,
        senderUsername: user!.username,
        isOptimistic: true, // Mark as optimistic
        isSending: true, // New flag for "Sending..." stage
      };

      // Optimistically update the messages cache
      queryClient.setQueryData(
        ['messages', conversationId, user?.id],
        (oldData: typeof messages) => {
          if (!oldData) return [optimisticMessage];
          return [...oldData, optimisticMessage];
        }
      );

      // Stage 2: After 1 second, show the actual message content
      const timeoutId = setTimeout(() => {
        queryClient.setQueryData(
          ['messages', conversationId, user?.id],
          (oldData: typeof messages) => {
            if (!oldData) return oldData;
            return oldData.map(msg =>
              msg.id === optimisticMessage.id
                ? { ...msg, isSending: false } // Remove sending flag, keep isOptimistic
                : msg
            );
          }
        );
      }, 1000);

      // Return context for rollback and cleanup
      return { previousMessages, optimisticMessage, timeoutId };
    },

    onError: (error, { conversationId }, context) => {
      // Clear timeout if it exists
      if (context?.timeoutId) {
        clearTimeout(context.timeoutId);
      }

      // If the mutation fails, rollback to previous data
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', conversationId, user?.id],
          context.previousMessages
        );
      }
      console.error('Failed to send message:', error);
    },

    onSuccess: (result, { conversationId }, context) => {
      // Clear timeout since we're handling the success
      if (context?.timeoutId) {
        clearTimeout(context.timeoutId);
      }

      if (result.success) {
        // Replace optimistic message with real message
        queryClient.setQueryData(
          ['messages', conversationId, user?.id],
          (oldData: typeof messages) => {
            if (!oldData) return [result.message];

            // Remove optimistic message and add real message
            const withoutOptimistic = oldData.filter(
              msg => msg.id !== context?.optimisticMessage.id
            );
            return [...withoutOptimistic, result.message];
          }
        );

        // Invalidate conversations to update last message
        queryClient.invalidateQueries({
          queryKey: ['conversations', user?.id],
        });
      }
    },

    onSettled: (result, error, { conversationId }) => {
      // Always invalidate to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId, user?.id],
      });
    },
  });

  // Effect to handle URL changes and set selected conversation
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    console.log('🔍 URL conversation parameter:', conversationId);
    console.log('📋 Available conversations:', conversations.length);

    // Reset state when search params change
    setHasTriedRefetch(false);

    if (conversationId && conversations.length > 0 && !selectedConversationId) {
      const conversation = conversations.find(c => c.id === conversationId);
      console.log('🎯 Found conversation:', conversation);

      if (conversation) {
        console.log('✅ Setting selected conversation:', conversationId);
        setSelectedConversationId(conversationId);
        setSelectedOtherUser(conversation.otherUser);
      } else {
        console.log('❌ Conversation not found in available conversations');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations]);

  // Effect to handle case where conversation ID is in URL but no conversations loaded
  useEffect(() => {
    const conversationId = searchParams.get('conversation');

    if (
      conversationId &&
      conversations.length === 0 &&
      !conversationsLoading &&
      refetchConversations &&
      !hasTriedRefetch
    ) {
      console.log(
        '🔄 Conversation ID in URL but no conversations loaded - refetching (ONCE)'
      );
      setHasTriedRefetch(true);
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      refetchConversations();
    }
  }, [
    searchParams,
    conversations.length,
    conversationsLoading,
    refetchConversations,
    queryClient,
    user?.id,
    hasTriedRefetch,
  ]);

  // Handle conversation selection
  const handleConversationSelect = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversationId(conversationId);
      setSelectedOtherUser(conversation.otherUser);

      // Redirect to messages page with selected conversation
      router.replace('/messages');

      // Mark messages as read
      try {
        await markMessagesAsRead(conversationId);
        // Refresh unread counts
        queryClient.invalidateQueries({ queryKey: ['unreadCount', user?.id] });
        queryClient.invalidateQueries({
          queryKey: ['conversations', user?.id],
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  // Handle sending a message using the mutation
  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user) return;

    // Use the mutation - optimistic update happens in onMutate
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content,
    });
  };

  // Handle archiving a conversation
  const handleArchiveConversation = async (conversationId: string) => {
    // 1. Optimistic update - immediately remove from UI
    queryClient.setQueryData(
      ['conversations', user?.id],
      (oldData: typeof conversations) => {
        if (!oldData) return oldData;
        // Mark conversation as archived optimistically
        return oldData.map(conv =>
          conv.id === conversationId ? { ...conv, isArchived: true } : conv
        );
      }
    );

    // 2. Clear selection if this was the selected conversation
    if (selectedConversationId === conversationId) {
      setSelectedConversationId('');
      setSelectedOtherUser(null);
    }

    try {
      // 3. Send to server
      const result = await archiveConversation(conversationId);

      if (!result.success) {
        // 4. If failed, revert the optimistic update
        queryClient.invalidateQueries({
          queryKey: ['conversations', user?.id],
        });
        console.error('Failed to archive conversation');
      }
    } catch (error) {
      // 5. If error, revert the optimistic update
      queryClient.invalidateQueries({
        queryKey: ['conversations', user?.id],
      });
      console.error('Error archiving conversation:', error);
    }
  };

  // Effect to redirect to sign-in if user is not authenticated
  useEffect(() => {
    if (isFetched && !user) {
      router.push(signInPath());
    }
  }, [isFetched, user, router]);

  // Show loading while checking authentication
  if (!isFetched) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Loading...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (will be handled by useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <h1 className="text-2xl font-bold mb-6 flex-shrink-0">Messages</h1>

          <Card className="flex-1 overflow-hidden min-h-0 max-h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0 rounded-lg shadow-2xl">
            <div className="flex h-full min-h-0 max-h-full">
              {/* Left Sidebar - Conversation List (30%) */}
              <div className="w-full md:w-[30%] border-r border-gray-200 dark:border-gray-700 h-full min-h-0 overflow-hidden">
                <ConversationList
                  conversations={conversations.map(conv => ({
                    ...conv,
                    lastMessage: conv.lastMessage
                      ? {
                          content: conv.lastMessage.content,
                          createdAt: conv.lastMessage.createdAt.toISOString(),
                        }
                      : undefined,
                  }))}
                  selectedConversationId={selectedConversationId}
                  onConversationSelect={handleConversationSelect}
                  onArchiveConversation={handleArchiveConversation}
                  isLoading={conversationsLoading}
                />
              </div>

              {/* Right Side - Chat Interface (70%) */}
              <div className="hidden md:block md:w-[70%] h-full min-h-0 overflow-hidden">
                <ChatInterface
                  conversationId={selectedConversationId}
                  currentUser={
                    user
                      ? { id: user.id, username: user.username }
                      : { id: '', username: '' }
                  }
                  otherUser={selectedOtherUser || { id: '', username: '' }}
                  messages={messages
                    .map(m => ({
                      id: m.id,
                      content: m.content,
                      createdAt:
                        typeof m.createdAt === 'string'
                          ? m.createdAt
                          : m.createdAt.toISOString(),
                      senderId: m.senderId,
                      senderUsername: m.senderUsername,
                      isOptimistic: m.isOptimistic || false,
                      isSending: m.isSending || false, // Include the new isSending flag
                    }))
                    .sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    )}
                  onSendMessage={handleSendMessage}
                  isLoading={messagesLoading}
                  isSending={sendMessageMutation.isPending}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
