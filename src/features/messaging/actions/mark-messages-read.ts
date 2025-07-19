'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';

export const markMessagesAsRead = async (conversationId: string) => {
  const auth = await getAuth();

  if (!auth.user) {
    return {
      error: 'You must be logged in to mark messages as read',
    };
  }

  try {
    // Update the user's participation to mark last read time as now
    const updated = await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: auth.user.id,
      },
      data: {
        lastReadAt: new Date(),
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
    console.error('Error marking messages as read:', error);
    return {
      error: 'Failed to mark messages as read',
    };
  }
};
