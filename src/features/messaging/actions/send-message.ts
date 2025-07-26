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
    // Use a transaction to create message and update conversation timestamp in one go
    const result = await prisma.$transaction(async tx => {
      // Create the message
      const message = await tx.message.create({
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
      await tx.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    });

    return {
      success: true,
      message: {
        id: result.id,
        content: result.content,
        createdAt: result.createdAt.toISOString(),
        senderId: result.senderId,
        senderUsername: result.sender.username,
      },
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      error: 'Failed to send message',
    };
  }
};
