import { prisma } from '@/lib/prisma';

export interface ConversationWithDetails {
  id: string;
  otherUser: {
    id: string;
    username: string;
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
  // Get all conversations where the user is a participant
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

  return conversations;
};
