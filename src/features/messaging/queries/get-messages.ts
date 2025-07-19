import { prisma } from '@/lib/prisma';

export interface MessageWithSender {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  senderUsername: string;
}

export const getMessages = async (
  conversationId: string,
  userId: string
): Promise<MessageWithSender[]> => {
  // Verify user is a participant in this conversation
  const participation = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId,
    },
  });

  if (!participation) {
    throw new Error('You are not a participant in this conversation');
  }

  // Get messages for the conversation
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    include: {
      sender: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return messages.map(message => ({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    senderId: message.senderId,
    senderUsername: message.sender.username,
  }));
};
