'use server';

import { getAuth } from '@/features/auth/queries/get-auth';
import { getMessages } from '../queries/get-messages';

export const getMessagesAction = async (conversationId: string) => {
  console.log(
    '🚀 Server Action: Getting messages for conversation:',
    conversationId
  );

  try {
    // Get current auth to ensure user can only see messages from their conversations
    const auth = await getAuth();

    if (!auth.user) {
      console.log('❌ Server Action: User not authenticated');
      return {
        error: 'You must be logged in to view messages',
        messages: null,
      };
    }

    // Get messages for this conversation
    const messages = await getMessages(conversationId, auth.user.id);

    console.log(
      '✅ Server Action: Successfully retrieved',
      messages.length,
      'messages'
    );

    return {
      success: true,
      messages,
    };
  } catch (error) {
    console.error('💥 Server Action: Error getting messages:', error);
    return {
      error: 'Failed to retrieve messages',
      messages: null,
    };
  }
};
