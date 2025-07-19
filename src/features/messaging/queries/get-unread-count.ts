import { prisma } from '@/lib/prisma';

export const getUnreadMessageCount = async (
  userId: string
): Promise<number> => {
  // Get all conversations where the user is a participant
  const participations = await prisma.conversationParticipant.findMany({
    where: {
      userId,
    },
    select: {
      conversationId: true,
      lastReadAt: true,
    },
  });

  let totalUnreadCount = 0;

  // For each conversation, count unread messages
  for (const participation of participations) {
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: participation.conversationId,
        senderId: { not: userId },
        createdAt: {
          gt: participation.lastReadAt || new Date(0),
        },
      },
    });

    totalUnreadCount += unreadCount;
  }

  return totalUnreadCount;
};
