/**
 * Get all posted items for the wall feed
 * Returns posts with user info and offer counts
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';
import { PostedItemWithDetails } from './posted-item.types';

/**
 * Get all posted items for the wall feed
 * Returns posts with user info and offer counts
 */
export const getPostedItems = async (): Promise<PostedItemWithDetails[]> => {
  try {
    // Get current user to determine ownership
    const { user: currentUser } = await getAuth();

    // Fetch all posted items with user and offer count
    const postedItems = await prisma.postedItem.findMany({
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
        createdAt: 'desc', // Show newest posts first
      },
    });

    // Add ownership flag to each post
    const postedItemsWithOwnership = postedItems.map(item => ({
      ...item,
      isOwner: currentUser ? item.userId === currentUser.id : false,
    }));

    return postedItemsWithOwnership;
  } catch (error) {
    console.error('Failed to fetch posted items:', error);
    return [];
  }
};
