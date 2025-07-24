'use server';

import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';

type CreateNotificationInput = {
  type: string;
  title: string;
  message: string;
  userId: string;
  postedItemId?: string;
  offerId?: string;
};

export const createNotification = async (
  input: CreateNotificationInput
): Promise<ActionState> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        userId: input.userId,
        postedItemId: input.postedItemId,
        offerId: input.offerId,
        isRead: false,
      },
    });

    return toActionState(
      'SUCCESS',
      'Notification created successfully',
      undefined,
      notification
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
    return fromErrorToActionState(error);
  }
};
