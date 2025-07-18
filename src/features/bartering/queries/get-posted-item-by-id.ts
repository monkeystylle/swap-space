/**
 * Get a single posted item by ID
 * Useful for individual post pages
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';
import { PostedItemWithDetails } from './posted-item.types';

/**
 * Get a single posted item by ID
 * Useful for individual post pages
 */
export const getPostedItemById = async (
  postedItemId: string
): Promise<PostedItemWithDetails | null> => {
  try {
    // Get current user to determine ownership
    const { user: currentUser } = await getAuth();

    // Fetch single posted item
    const postedItem = await prisma.postedItem.findUnique({
      where: {
        id: postedItemId,
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
    });

    if (!postedItem) {
      return null;
    }

    // Add ownership flag
    return {
      ...postedItem,
      isOwner: currentUser ? postedItem.userId === currentUser.id : false,
    };
  } catch (error) {
    console.error('Failed to fetch posted item:', error);
    return null;
  }
};
