'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createOrFindConversation } from '../actions/create-or-find-conversation';
import { messagesPath } from '@/paths';

interface MessageUserButtonProps {
  userId: string;
  username: string;
}

export const MessageUserButton = ({
  userId,
  username,
}: MessageUserButtonProps) => {
  const router = useRouter();

  const createConversationMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      createOrFindConversation(targetUserId),
    onSuccess: result => {
      console.log('📞 Server action result:', result);

      if (result.success && result.conversationId) {
        const redirectUrl = `${messagesPath()}?conversation=${
          result.conversationId
        }`;
        console.log('✅ Success! Redirecting to:', redirectUrl);
        router.push(redirectUrl);
      } else {
        console.error('❌ Failed to create/find conversation:', result.error);
        console.log('🔄 Falling back to messages page');
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
