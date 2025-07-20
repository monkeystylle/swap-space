'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ConversationList } from '@/features/messaging/components/conversation-list';
import { ChatInterface } from '@/features/messaging/components/chat-interface';
import { useConversations } from '@/features/messaging/hooks/use-conversations';
import { useMessages } from '@/features/messaging/hooks/use-messages';
import { sendMessage } from '@/features/messaging/actions/send-message';
import { archiveConversation } from '@/features/messaging/actions/archive-conversation';
import { markMessagesAsRead } from '@/features/messaging/actions/mark-messages-read';
import { useQueryClient } from '@tanstack/react-query';
import { signInPath } from '@/paths';

export function MessagesPageContent() {
  const { user, isFetched } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();

  // State to track selected conversation and other user details
  // This will be set based on URL params or conversation selection
  // and used to display the chat interface
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');

  // State to track the other user in the selected conversation
  // This will be used to display the chat interface correctly
  const [selectedOtherUser, setSelectedOtherUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  // State to track if we've tried refetching conversations
  // when the URL has a conversation ID but no conversations loaded
  const [hasTriedRefetch, setHasTriedRefetch] = useState(false);

  // Optimistic messages state
  // This will hold messages that are sent but not yet confirmed by the server
  const [optimisticMessages, setOptimisticMessages] = useState<
    Array<{
      id: string;
      content: string;
      createdAt: string;
      senderId: string;
      senderUsername: string;
      isOptimistic: boolean;
    }>
  >([]);

  // State to track if a message is currently being sent
  // This will prevent multiple sends at the same time
  const [isSending, setIsSending] = useState(false);

  // Fetch conversations for the current user
  // This will be used to populate the conversation list
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useConversations(user?.id);

  // Fetch messages for the selected conversation
  // This will be used to display the chat messages in the interface
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversationId,
    user?.id
  );

  // Effect to handle URL changes and set selected conversation
  // This will run whenever the search params change
  // and will update the selected conversation based on the URL

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    console.log('🔍 URL conversation parameter:', conversationId);
    console.log('📋 Available conversations:', conversations.length);

    // Reset state when search params change
    // This ensures we don't keep stale state
    setHasTriedRefetch(false);

    // If a conversation ID is present in the URL, find it in the conversations list
    // and set it as the selected conversation
    // Also set the other user based on the conversation details
    // This will ensure the chat interface displays the correct conversation
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
  // This will refetch conversations once if we haven't tried it yet
  // This ensures we can still load the conversation if it exists
  // This is useful for cases where the user navigates directly to a conversation URL
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

  // Handle conversation selection and message sending
  // This will update the selected conversation and mark messages as read
  // It will also handle sending messages and optimistic updates
  const handleConversationSelect = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversationId(conversationId);
      setSelectedOtherUser(conversation.otherUser);
      // Clear optimistic messages when switching conversations
      setOptimisticMessages([]);

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

  // Handle sending a message
  // This will create an optimistic message immediately
  // and then send it to the server
  // If successful, it will update the messages cache
  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user || isSending) return;

    setIsSending(true);

    // Create optimistic message
    const optimisticMessage = {
      id: uuidv4(),
      content,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      senderUsername: user.username,
      isOptimistic: true,
    };

    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    try {
      const result = await sendMessage(selectedConversationId, content);
      if (result.success) {
        // Remove optimistic message and let the real data take over
        setOptimisticMessages(prev =>
          prev.filter(msg => msg.id !== optimisticMessage.id)
        );

        // Optimistically update the messages cache
        queryClient.setQueryData(
          ['messages', selectedConversationId, user?.id],
          (oldData: typeof messages) => {
            if (!oldData) return oldData;
            return [...oldData, result.message];
          }
        );

        // Invalidate conversations to update last message
        queryClient.invalidateQueries({
          queryKey: ['conversations', user?.id],
        });
      } else {
        // If failed, remove the optimistic message
        setOptimisticMessages(prev =>
          prev.filter(msg => msg.id !== optimisticMessage.id)
        );
        console.error('Failed to send message:', result.error);
      }
    } catch (error) {
      // If error, remove the optimistic message
      setOptimisticMessages(prev =>
        prev.filter(msg => msg.id !== optimisticMessage.id)
      );
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle archiving a conversation
  // This will archive the conversation and update the UI accordingly
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
  // This will check if the user is fetched and redirect to sign-in if not
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

  // Return your existing JSX
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
                  messages={[
                    ...messages.map(m => ({
                      id: m.id,
                      content: m.content,
                      createdAt:
                        typeof m.createdAt === 'string'
                          ? m.createdAt
                          : m.createdAt.toISOString(),
                      senderId: m.senderId,
                      senderUsername: m.senderUsername,
                    })),
                    ...optimisticMessages.filter(
                      msg => !msg.isOptimistic || msg.senderId === user?.id
                    ),
                  ].sort(
                    (a, b) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime()
                  )}
                  onSendMessage={handleSendMessage}
                  isLoading={messagesLoading}
                  isSending={isSending}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
