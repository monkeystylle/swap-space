import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { sendMessage } from '@/features/messaging/actions/send-message';

interface SendMessageParams {
  conversationId: string;
  content: string;
}

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderUsername: string;
  isOptimistic?: boolean;
  isSending?: boolean;
}

interface UseSendMessageProps {
  user: User | null;
}

export function useSendMessage({ user }: UseSendMessageProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: SendMessageParams) =>
      sendMessage(conversationId, content),

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
      const optimisticMessage: Message = {
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
        (oldData: Message[]) => {
          if (!oldData) return [optimisticMessage];
          return [...oldData, optimisticMessage];
        }
      );

      // Stage 2: After 1 second, show the actual message content
      const timeoutId = setTimeout(() => {
        queryClient.setQueryData(
          ['messages', conversationId, user?.id],
          (oldData: Message[]) => {
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
          (oldData: Message[]) => {
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
}
