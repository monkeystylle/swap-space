'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archive, User as UserIcon } from 'lucide-react';
import { capitalizeFirstLetter } from '@/utils/text-utils';
import { getAvatarColor } from '@/utils/avatar-colors';

import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getMessagesAction } from '../actions/get-messages-action';

export interface ConversationSummary {
  id: string;
  otherUser: {
    id: string;
    username: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  isArchived: boolean;
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onArchiveConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onArchiveConversation,
  isLoading,
}: ConversationListProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const activeConversations = conversations.filter(conv => !conv.isArchived);

  // Prefetch messages on hover
  const handleConversationHover = (conversationId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['messages', conversationId, user?.id],
      queryFn: async () => {
        const result = await getMessagesAction(conversationId);
        if (result.error) {
          throw new Error(result.error);
        }
        return result.messages || [];
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <div className="p-4">
          <h3 className="font-semibold mb-4">Conversations</h3>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="h-16 px-4 flex items-center flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Conversations</h3>
      </div>
      <div className="flex-1 p-4 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {activeConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">
                  Visit someone&apos;s wall to start messaging!
                </p>
              </div>
            ) : (
              activeConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors group hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedConversationId === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                  onMouseEnter={() => handleConversationHover(conversation.id)} // Add this line
                >
                  {/* All your existing conversation item JSX stays exactly the same */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(
                          conversation.otherUser.username
                        )} flex items-center justify-center text-white font-medium text-sm`}
                      >
                        {capitalizeFirstLetter(
                          conversation.otherUser.username
                        ).charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm truncate">
                            {capitalizeFirstLetter(
                              conversation.otherUser.username
                            )}
                          </h4>
                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="bg-blue-500 text-white text-xs"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      onClick={e => {
                        e.stopPropagation();
                        onArchiveConversation(conversation.id);
                      }}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
