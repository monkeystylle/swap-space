// Posted Items Queries
// This file will contain all queries for fetching posted items data

/**
 * Queries for fetching posted items
 * Includes user information and offer counts for display
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';

// Type for posted item with user and offer information
export interface PostedItemWithDetails {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  details: string;
  status: 'OPEN' | 'DONE';
  imagePublicId: string | null;
  imageSecureUrl: string | null;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  _count: {
    offers: number;
  };
  // Flag to indicate if current user owns this post
  isOwner: boolean;
}

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
    console.error('Failed to fetch open posted items:', error);
    return [];
  }
};

export {};
