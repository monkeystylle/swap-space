'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';

export const createOrFindConversation = async (otherUserId: string) => {
  console.log(
    '🚀 Server: Creating/finding conversation with user:',
    otherUserId
  );

  const auth = await getAuth();
  console.log('🔐 Server: Auth result:', {
    userId: auth.user?.id,
    username: auth.user?.username,
  });

  if (!auth.user) {
    console.log('❌ Server: User not authenticated');
    return {
      error: 'You must be logged in to start a conversation',
    };
  }

  if (auth.user.id === otherUserId) {
    console.log('❌ Server: Cannot message self');
    return {
      error: 'You cannot start a conversation with yourself',
    };
  }

  try {
    // Check if the other user exists
    console.log('🔍 Server: Looking for user:', otherUserId);
    const otherUser = await prisma.user.findUnique({
      where: {
        id: otherUserId,
      },
      select: {
        id: true,
        username: true,
      },
    });

    console.log('👤 Server: Other user found:', otherUser);
    if (!otherUser) {
      console.log('❌ Server: User not found');
      return {
        error: 'User not found',
      };
    }

    // Look for an existing conversation between these two users
    console.log(
      '🔍 Server: Looking for existing conversation between users:',
      auth.user.id,
      'and',
      otherUserId
    );
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

    console.log(
      '💬 Server: Existing participation found:',
      existingParticipation ? 'YES' : 'NO'
    );
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

      console.log(
        '✅ Server: Returning existing conversation:',
        existingParticipation.conversation.id
      );
      return {
        success: true,
        conversationId: existingParticipation.conversation.id,
        conversation: existingParticipation.conversation,
        otherUser,
      };
    }

    // Create a new conversation
    console.log('➕ Server: Creating new conversation');
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

    console.log('✅ Server: Created new conversation:', conversation.id);
    return {
      success: true,
      conversationId: conversation.id,
      conversation: conversation,
      otherUser,
    };
  } catch (error) {
    console.error('💥 Server: Error creating/finding conversation:', error);
    return {
      error: 'Failed to create or find conversation',
    };
  }
};
