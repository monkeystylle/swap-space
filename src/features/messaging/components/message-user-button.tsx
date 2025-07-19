'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

  const handleMessageUser = async () => {
    try {
      const result = await createOrFindConversation(userId);

      if (result.success && result.conversationId) {
        // Redirect to messages page with this conversation selected
        router.push(`${messagesPath()}?conversation=${result.conversationId}`);
      } else {
        console.error('Failed to create/find conversation:', result.error);
        // Still redirect to messages page even if conversation creation fails
        router.push(messagesPath());
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Fallback: redirect to messages page
      router.push(messagesPath());
    }
  };

  return (
    <Button
      onClick={handleMessageUser}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <MessageCircle className="w-4 h-4" />
      Message {username}
    </Button>
  );
};
