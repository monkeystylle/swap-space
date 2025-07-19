'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';

export const archiveConversation = async (conversationId: string) => {
  const auth = await getAuth();

  if (!auth.user) {
    return {
      error: 'You must be logged in to archive a conversation',
    };
  }

  try {
    // Update the user's participation to mark as archived
    const updated = await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: auth.user.id,
      },
      data: {
        archivedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return {
        error: 'Conversation not found or you are not a participant',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error archiving conversation:', error);
    return {
      error: 'Failed to archive conversation',
    };
  }
};
