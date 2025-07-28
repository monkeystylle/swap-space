'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useCachedAuth } from '@/features/auth/hooks/use-cached-auth';
import { ConversationList } from '@/features/messaging/components/conversation-list';
import { ChatInterface } from '@/features/messaging/components/chat-interface';
import { useConversations } from '@/features/messaging/hooks/use-conversations';
import { useMessages } from '@/features/messaging/hooks/use-messages';
import { useSendMessage } from '@/features/messaging/hooks/use-send-message'; // Import the new hook
import { archiveConversation } from '@/features/messaging/actions/archive-conversation';
import { markMessagesAsRead } from '@/features/messaging/actions/mark-messages-read';
import { useQueryClient } from '@tanstack/react-query';
import { MessagesLoadingSkeleton } from './messages-loading-skeleton';

export function MessagesPageContent() {
  // Since we're in the authenticated layout, we know user exists
  // Now properly handle loading state from useCachedAuth for better performance
  const { user, isLoading: authLoading } = useCachedAuth();
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

  // Use the custom send message hook
  const sendMessageMutation = useSendMessage({ user });

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

  // Handle sending a message using the custom hook
  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user) return;

    // Use the custom hook - optimistic update happens in the hook
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

  // Early return with skeleton only if auth is still loading
  if (authLoading) {
    return <MessagesLoadingSkeleton />;
  }

  // If auth completed but no user, they shouldn't be on this page
  // (handled by authenticated layout, but just in case)
  if (!user) {
    return <MessagesLoadingSkeleton />;
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
