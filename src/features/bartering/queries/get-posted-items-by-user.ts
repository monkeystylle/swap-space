/**
 * Get posted items for a specific user
 * Useful for user profile pages
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';
import { PostedItemWithDetails } from './posted-item.types';

/**
 * Get posted items for a specific user
 * Useful for user profile pages
 */
export const getPostedItemsByUser = async (
  userId: string
): Promise<PostedItemWithDetails[]> => {
  try {
    // Get current user to determine ownership
    const { user: currentUser } = await getAuth();

    // Fetch posted items for specific user
    const postedItems = await prisma.postedItem.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            offers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add ownership flag
    const postedItemsWithOwnership = postedItems.map(item => ({
      ...item,
      isOwner: currentUser ? item.userId === currentUser.id : false,
    }));

    return postedItemsWithOwnership;
  } catch (error) {
    console.error('Failed to fetch user posted items:', error);
    return [];
  }
};
