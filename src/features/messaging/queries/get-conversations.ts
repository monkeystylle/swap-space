import { prisma } from '@/lib/prisma';

export interface ConversationWithDetails {
  id: string;
  otherUser: {
    id: string;
    username: string;
    profile: {
      id: string;
      profilePictureSecureUrl: string | null;
      profilePicturePublicId: string | null;
    } | null;
  };
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
  };
  unreadCount: number;
  isArchived: boolean;
  updatedAt: Date;
}

export const getConversations = async (
  userId: string
): Promise<ConversationWithDetails[]> => {
  console.log('🔍 Query: Getting conversations for user:', userId);

  try {
    // Get all conversations where the user is a participant
    console.log('📡 Query: Starting Prisma query...');
    const conversationParticipants =
      await prisma.conversationParticipant.findMany({
        where: {
          userId,
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
                      profile: {
                        select: {
                          id: true,
                          profilePictureSecureUrl: true,
                          profilePicturePublicId: true,
                        },
                      },
                    },
                  },
                },
              },
              messages: {
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  senderId: true,
                },
              },
            },
          },
        },
        orderBy: {
          conversation: {
            updatedAt: 'desc',
          },
        },
      });

    console.log('✅ Query: Prisma query completed successfully');

    console.log(
      '📊 Query: Found conversation participants:',
      conversationParticipants.length
    );

    // Transform the data to include other user info and unread count
    const conversations: ConversationWithDetails[] = [];

    for (const participant of conversationParticipants) {
      const { conversation } = participant;

      // Get the other user in this conversation
      const otherParticipant = conversation.participants.find(
        p => p.userId !== userId
      );

      if (!otherParticipant) continue;

      // Count unread messages
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          createdAt: {
            gt: participant.lastReadAt || new Date(0),
          },
        },
      });

      conversations.push({
        id: conversation.id,
        otherUser: otherParticipant.user,
        lastMessage: conversation.messages[0] || undefined,
        unreadCount,
        isArchived: !!participant.archivedAt,
        updatedAt: conversation.updatedAt,
      });
    }

    console.log('✅ Query: Returning conversations:', conversations.length);

    return conversations;
  } catch (error) {
    console.error('💥 Query: Error in getConversations:', error);
    throw error;
  }
};
