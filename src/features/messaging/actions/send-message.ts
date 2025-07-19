'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';

export const sendMessage = async (conversationId: string, content: string) => {
  const auth = await getAuth();

  if (!auth.user) {
    return {
      error: 'You must be logged in to send a message',
    };
  }

  try {
    // Verify user is a participant in this conversation
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: auth.user.id,
      },
    });

    if (!participation) {
      return {
        error: 'You are not a participant in this conversation',
      };
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        conversationId,
        senderId: auth.user.id,
      },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        senderId: message.senderId,
        senderUsername: message.sender.username,
      },
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      error: 'Failed to send message',
    };
  }
};
