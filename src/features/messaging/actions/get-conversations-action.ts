'use server';

import { getAuth } from '@/features/auth/queries/get-auth';
import { getConversations } from '../queries/get-conversations';

export const getConversationsAction = async (userId?: string) => {
  console.log('🚀 Server Action: Getting conversations for user:', userId);

  try {
    // Get current auth to ensure user can only see their own conversations
    const auth = await getAuth();

    if (!auth.user) {
      console.log('❌ Server Action: User not authenticated');
      return {
        error: 'You must be logged in to view conversations',
        conversations: null,
      };
    }

    // Use the authenticated user's ID, not the passed userId for security
    const conversations = await getConversations(auth.user.id);

    console.log(
      '✅ Server Action: Successfully retrieved',
      conversations.length,
      'conversations'
    );

    return {
      success: true,
      conversations,
    };
  } catch (error) {
    console.error('💥 Server Action: Error getting conversations:', error);
    return {
      error: 'Failed to retrieve conversations',
      conversations: null,
    };
  }
};
