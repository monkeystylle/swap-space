'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';

export const createOrFindConversation = async (otherUserId: string) => {
  const auth = await getAuth();

  if (!auth.user) {
    return {
      error: 'You must be logged in to start a conversation',
    };
  }

  if (auth.user.id === otherUserId) {
    return {
      error: 'You cannot start a conversation with yourself',
    };
  }

  try {
    // Check if the other user exists
    const otherUser = await prisma.user.findUnique({
      where: {
        id: otherUserId,
      },
      select: {
        id: true,
        username: true,
      },
    });

    if (!otherUser) {
      return {
        error: 'User not found',
      };
    }

    // Look for an existing conversation between these two users
    const existingParticipation =
      await prisma.conversationParticipant.findFirst({
        where: {
          userId: auth.user.id,
          conversation: {
            participants: {
              some: {
                userId: otherUserId,
              },
            },
          },
        },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (existingParticipation) {
      // If conversation exists but is archived, unarchive it
      if (existingParticipation.archivedAt) {
        await prisma.conversationParticipant.update({
          where: {
            id: existingParticipation.id,
          },
          data: {
            archivedAt: null,
          },
        });
      }

      return {
        success: true,
        conversationId: existingParticipation.conversation.id,
        otherUser,
      };
    }

    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            {
              userId: auth.user.id,
            },
            {
              userId: otherUserId,
            },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      conversationId: conversation.id,
      otherUser,
    };
  } catch (error) {
    console.error('Error creating/finding conversation:', error);
    return {
      error: 'Failed to create or find conversation',
    };
  }
};
