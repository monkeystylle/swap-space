'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

const MessagesPage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedConversationId, setSelectedConversationId] =
    useState<string>('');
  const [selectedOtherUser, setSelectedOtherUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  // Get conversations
  const { data: conversations = [], isLoading: conversationsLoading } =
    useConversations(user?.id);

  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useMessages(
    selectedConversationId,
    user?.id
  );

  // Handle conversation selection from URL params
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversationId(conversationId);
        setSelectedOtherUser(conversation.otherUser);
      }
    }
  }, [searchParams, conversations]);

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

  // Redirect if not authenticated
  if (!user) {
    getAuthOrRedirect();
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        <Card className="h-[80vh] overflow-hidden">
          <div className="flex h-full">
            {/* Left Sidebar - Conversation List (30%) */}
            <div className="w-full md:w-[30%] border-r border-gray-200 dark:border-gray-700">
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
            <div className="hidden md:block md:w-[70%]">
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
  );
};

export default MessagesPage;
