/**
 * Get posted items with open status only
 * Useful for marketplace/trading views
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';
import { PostedItemWithDetails } from './posted-item.types';

/**
 * Get posted items with open status only
 * Useful for marketplace/trading views
 */
export const getOpenPostedItems = async (): Promise<
  PostedItemWithDetails[]
> => {
  try {
    // Get current user to determine ownership
    const { user: currentUser } = await getAuth();

    // Fetch only open posted items
    const postedItems = await prisma.postedItem.findMany({
      where: {
        status: 'OPEN',
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        details: true,
        status: true,
        category: true,
        tag: true,
        imagePublicId: true,
        imageSecureUrl: true,
        userId: true,
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
    console.error('Failed to fetch open posted items:', error);
    return [];
  }
};
