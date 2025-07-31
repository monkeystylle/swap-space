/**
 * Search posted items by search terms
 * Filters posted items based on exact word matches in title and details
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';
import { PostedItemWithDetails } from '@/features/bartering/queries/posted-item.types';

export interface SearchPostedItemsParams {
  searchTerm?: string;
  category?: 'ITEM' | 'SERVICE' | 'ALL';
  page?: number;
  limit?: number;
}

export interface SearchPostedItemsResponse {
  items: PostedItemWithDetails[];
  hasMore: boolean;
  total: number;
}

// Type for raw SQL query result
interface RawPostedItemResult {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  details: string;
  status: 'OPEN' | 'DONE';
  category: 'ITEM' | 'SERVICE';
  tag: string | null;
  imagePublicId: string | null;
  imageSecureUrl: string | null;
  userId: string;
  user_id: string;
  user_username: string;
  user_email: string;
  offers_count: number;
}

/**
 * Search posted items with open status by search terms
 * Uses PostgreSQL regex for exact word matching
 */
export const searchPostedItems = async ({
  searchTerm = '',
  category = 'ALL',
  page = 1,
  limit = 12,
}: SearchPostedItemsParams): Promise<SearchPostedItemsResponse> => {
  try {
    // Get current user to determine ownership
    const { user: currentUser } = await getAuth();

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query parameters separately for count and items queries
    const countParams: (string | number)[] = [];
    const itemsParams: (string | number)[] = [];
    let paramCounter = 1;

    // Category filter
    let categoryFilter = '';
    if (category && category !== 'ALL') {
      categoryFilter = `AND p.category::text = $${paramCounter}`;
      countParams.push(category);
      itemsParams.push(category);
      paramCounter++;
    }

    // Search filter
    let searchFilter = '';
    if (searchTerm.trim()) {
      const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

      if (searchWords.length > 0) {
        const wordConditions: string[] = [];

        searchWords.forEach(word => {
          // Escape special regex characters for safety
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // PostgreSQL word boundary regex pattern (case insensitive)
          const regexPattern = `\\m${escapedWord}\\M`;

          countParams.push(regexPattern);
          itemsParams.push(regexPattern);
          wordConditions.push(`(
            p.title ~* $${paramCounter} OR 
            p.details ~* $${paramCounter} OR 
            COALESCE(p.tag, '') ~* $${paramCounter} OR 
            u.username ~* $${paramCounter}
          )`);
          paramCounter++;
        });

        searchFilter = `AND (${wordConditions.join(' AND ')})`;
      }
    }

    // Add pagination parameters only to items query
    const limitParam = paramCounter;
    const offsetParam = paramCounter + 1;
    itemsParams.push(limit, skip);

    // SQL query for counting total results
    const countQuery = `
      SELECT COUNT(*)::int as count
      FROM "PostedItem" p
      JOIN "User" u ON p."userId" = u.id
      WHERE p.status = 'OPEN'
      ${categoryFilter}
      ${searchFilter}
    `;

    // SQL query for fetching items with all required data
    const itemsQuery = `
      SELECT 
        p.id,
        p."createdAt",
        p."updatedAt",
        p.title,
        p.details,
        p.status,
        p.category,
        p.tag,
        p."imagePublicId",
        p."imageSecureUrl",
        p."userId",
        u.id as "user_id",
        u.username as "user_username",
        u.email as "user_email",
        (SELECT COUNT(*)::int FROM "Offer" o WHERE o."postedItemId" = p.id) as "offers_count"
      FROM "PostedItem" p
      JOIN "User" u ON p."userId" = u.id
      WHERE p.status = 'OPEN'
      ${categoryFilter}
      ${searchFilter}
      ORDER BY p."createdAt" DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Execute both queries with their respective parameters
    const [countResult, itemsResult] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: number }]>(countQuery, ...countParams),
      prisma.$queryRawUnsafe<RawPostedItemResult[]>(itemsQuery, ...itemsParams),
    ]);

    const total = countResult[0]?.count || 0;

    // Transform raw SQL results to match expected PostedItemWithDetails format
    const postedItemsWithOwnership: PostedItemWithDetails[] = itemsResult.map(
      (item: RawPostedItemResult) => ({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        title: item.title,
        details: item.details,
        status: item.status,
        category: item.category,
        tag: item.tag,
        imagePublicId: item.imagePublicId,
        imageSecureUrl: item.imageSecureUrl,
        userId: item.userId,
        user: {
          id: item.user_id,
          username: item.user_username,
          email: item.user_email,
        },
        _count: {
          offers: item.offers_count,
        },
        isOwner: currentUser ? item.userId === currentUser.id : false,
      })
    );

    return {
      items: postedItemsWithOwnership,
      hasMore: skip + postedItemsWithOwnership.length < total,
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
