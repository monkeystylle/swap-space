'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleMessageUser = async () => {
    console.log('🔄 Starting conversation with user:', userId, username);
    setIsLoading(true);

    try {
      const result = await createOrFindConversation(userId);
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
    } catch (error) {
      console.error('💥 Error starting conversation:', error);
      console.log('🔄 Fallback: redirecting to messages page');
      router.push(messagesPath());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMessageUser}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 cursor-pointer"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {isLoading ? 'Starting...' : `Message ${username}`}
    </Button>
  );
};
