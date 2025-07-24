'use server';

import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

export const markNotificationAsRead = async (
  notificationId: string
): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Update notification to mark as read, but only if it belongs to the authenticated user
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id, // Security: Only allow users to mark their own notifications as read
      },
      data: {
        isRead: true,
      },
    });

    if (notification.count === 0) {
      return toActionState('ERROR', 'Notification not found or access denied');
    }

    return toActionState('SUCCESS', 'Notification marked as read');
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return fromErrorToActionState(error);
  }
};
