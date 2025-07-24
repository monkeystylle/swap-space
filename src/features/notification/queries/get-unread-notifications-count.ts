import { prisma } from '@/lib/prisma';

export const getUnreadNotificationsCount = async (userId: string) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw error;
  }
};
