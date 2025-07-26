'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createOrFindConversation } from '../actions/create-or-find-conversation';
import { messagesPath } from '@/paths';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

interface MessageUserButtonProps {
  userId: string;
  username: string;
}

export const MessageUserButton = ({
  userId,
  username,
}: MessageUserButtonProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createConversationMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      createOrFindConversation(targetUserId),
    onSuccess: result => {
      console.log('📞 Server action result:', result);

      if (result.success && result.conversationId) {
        // Optimistic update - add/unarchive conversation immediately
        if (result.conversation && user?.id) {
          // Transform the raw conversation data to match ConversationWithDetails structure
          const otherParticipant = result.conversation.participants.find(
            p => p.user.id !== user.id
          );

          const transformedConversation = {
            id: result.conversation.id,
            otherUser: otherParticipant?.user || { id: userId, username },
            lastMessage: undefined, // New conversations don't have messages yet
            unreadCount: 0, // New conversations start with 0 unread
            isArchived: false, // New/unarchived conversations
            updatedAt: new Date(), // Current time for new conversations
          };

          queryClient.setQueryData(
            ['conversations', user.id],
            (oldData: unknown) => {
              if (!oldData) return [transformedConversation];

              // Type guard to ensure oldData is an array
              if (!Array.isArray(oldData)) return [transformedConversation];

              // Check if conversation already exists
              const existingIndex = oldData.findIndex(
                (conv: unknown) =>
                  typeof conv === 'object' &&
                  conv !== null &&
                  'id' in conv &&
                  (conv as { id: string }).id === result.conversationId
              );

              if (existingIndex >= 0) {
                // Unarchive existing conversation
                return oldData.map((conv, index) =>
                  index === existingIndex
                    ? { ...(conv as object), isArchived: false }
                    : conv
                );
              } else {
                // Add new conversation
                return [transformedConversation, ...oldData];
              }
            }
          );
        }

        const redirectUrl = `${messagesPath()}?conversation=${
          result.conversationId
        }`;
        console.log('✅ Success! Redirecting to:', redirectUrl);
        router.push(redirectUrl);
      } else {
        console.error('❌ Failed to create/find conversation:', result.error);
        router.push(messagesPath());
      }
    },
    onError: error => {
      console.error('💥 Error starting conversation:', error);
      console.log('🔄 Fallback: redirecting to messages page');
      router.push(messagesPath());
    },
  });

  const handleMessageUser = () => {
    console.log('🔄 Starting conversation with user:', userId, username);
    createConversationMutation.mutate(userId);
  };

  return (
    <Button
      onClick={handleMessageUser}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 cursor-pointer"
      disabled={createConversationMutation.isPending}
    >
      {createConversationMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {createConversationMutation.isPending
        ? 'Starting...'
        : `Message ${username}`}
    </Button>
  );
};
