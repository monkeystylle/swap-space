/**
 * Search posted items by search terms
 * Filters posted items based on search terms in title and details
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';
import { PostedItemWithDetails } from '@/features/bartering/queries/posted-item.types';

export interface SearchPostedItemsParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export interface SearchPostedItemsResponse {
  items: PostedItemWithDetails[];
  hasMore: boolean;
  total: number;
}

/**
 * Search posted items with open status by search terms
 * Splits search terms and searches in both title and details
 */
export const searchPostedItems = async ({
  searchTerm = '',
  page = 1,
  limit = 12,
}: SearchPostedItemsParams): Promise<SearchPostedItemsResponse> => {
  try {
    // Get current user to determine ownership
    const { user: currentUser } = await getAuth();

    // Build search conditions
    const whereConditions: {
      status: 'OPEN';
      AND?: Array<{
        OR: Array<{
          title?: { contains: string; mode: 'insensitive' };
          details?: { contains: string; mode: 'insensitive' };
        }>;
      }>;
    } = {
      status: 'OPEN', // Only show open items
    };

    // Add search conditions if search term exists
    if (searchTerm.trim()) {
      const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

      if (searchWords.length > 0) {
        whereConditions.AND = searchWords.map(word => ({
          OR: [
            {
              title: {
                contains: word,
                mode: 'insensitive' as const,
              },
            },
            {
              details: {
                contains: word,
                mode: 'insensitive' as const,
              },
            },
          ],
        }));
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.postedItem.count({
      where: whereConditions,
    });

    // Fetch posted items with pagination
    const postedItems = await prisma.postedItem.findMany({
      where: whereConditions,
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
      skip,
      take: limit,
    });

    // Add ownership flag to each item
    const postedItemsWithOwnership = postedItems.map(item => ({
      ...item,
      isOwner: currentUser ? item.userId === currentUser.id : false,
    }));

    return {
      items: postedItemsWithOwnership,
      hasMore: skip + postedItems.length < total,
      total,
    };
  } catch (error) {
    console.error('Failed to search posted items:', error);
    return {
      items: [],
      hasMore: false,
      total: 0,
    };
  }
};
