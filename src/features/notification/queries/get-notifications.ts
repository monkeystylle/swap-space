import { prisma } from '@/lib/prisma';

export const getNotifications = async (userId: string) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        postedItem: {
          select: {
            id: true,
            title: true,
          },
        },
        offer: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export type NotificationWithDetails = Awaited<
  ReturnType<typeof getNotifications>
>[number];
