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
import { useQueryClient } from '@tanstack/react-query';
import { signInPath } from '@/paths';

const MessagesPage = () => {
  const { user, isFetched } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [selectedOtherUser, setSelectedOtherUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [hasTriedRefetch, setHasTriedRefetch] = useState(false);

  // Get conversations
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useConversations(user?.id);

  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversationId,
    user?.id
  );

  // Handle conversation selection from URL params
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    console.log('🔍 URL conversation parameter:', conversationId);
    console.log('📋 Available conversations:', conversations.length);

    // Reset refetch state when URL changes
    setHasTriedRefetch(false);

    if (conversationId && conversations.length > 0) {
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
  }, [searchParams, conversations]);

  // Separate effect to handle refetching when conversation ID exists but no conversations loaded
  // Only try once to prevent infinite loops
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

  const handleConversationSelect = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversationId(conversationId);
      setSelectedOtherUser(conversation.otherUser);

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

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      const result = await sendMessage(selectedConversationId, content);
      if (result.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ['conversations', user?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ['messages', selectedConversationId, user?.id],
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const result = await archiveConversation(conversationId);
      if (result.success) {
        // If this was the selected conversation, clear selection
        if (selectedConversationId === conversationId) {
          setSelectedConversationId('');
          setSelectedOtherUser(null);
        }
        // Refresh conversations
        queryClient.invalidateQueries({
          queryKey: ['conversations', user?.id],
        });
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  // Handle authentication
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
    <div className="h-screen flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-6">Messages</h1>

          <Card className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Left Sidebar - Conversation List (30%) */}
              <div className="w-full md:w-[30%] border-r border-gray-200 dark:border-gray-700 h-full">
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
              <div className="hidden md:block md:w-[70%] h-full">
                <ChatInterface
                  conversationId={selectedConversationId}
                  currentUser={
                    user
                      ? { id: user.id, username: user.username }
                      : { id: '', username: '' }
                  }
                  otherUser={selectedOtherUser || { id: '', username: '' }}
                  messages={messages.map(m => ({
                    id: m.id,
                    content: m.content,
                    createdAt: m.createdAt.toISOString(),
                    senderId: m.senderId,
                    senderUsername: m.senderUsername,
                  }))}
                  onSendMessage={handleSendMessage}
                  isLoading={messagesLoading}
                  isSending={false} // TODO: Add sending state
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
