/**
 * Query functions for offers in the bartering system
 * Server-side functions to fetch offer data with user information
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getAuth } from '@/features/auth/queries/get-auth';
import { OfferWithDetails } from './offer.types';

/**
 * Get all offers for a specific posted item
 * Returns offers with user info and ownership flags
 */
export const getOffersForPostedItem = async (
  postedItemId: string
): Promise<OfferWithDetails[]> => {
  try {
    // Get current user to determine ownership
    const { user: currentUser } = await getAuth();

    // Fetch all offers for the posted item with user information
    const offers = await prisma.offer.findMany({
      where: {
        postedItemId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                id: true,
                profilePictureSecureUrl: true,
                profilePicturePublicId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest offers first
      },
    });

    // Add ownership flag to each offer
    const offersWithOwnership = offers.map(offer => ({
      ...offer,
      isOwner: currentUser ? offer.userId === currentUser.id : false,
    }));

    return offersWithOwnership;
  } catch (error) {
    console.error('Failed to fetch offers for posted item:', error);
    return [];
  }
};

/**
 * Get a specific user's offer for a posted item
 * Used to check if user already has an offer and for edit functionality
 */
export const getUserOfferForPostedItem = async (
  postedItemId: string
): Promise<OfferWithDetails | null> => {
  try {
    // Get current user
    const { user: currentUser } = await getAuth();

    if (!currentUser) {
      return null;
    }

    // Find the user's offer for this posted item
    const offer = await prisma.offer.findUnique({
      where: {
        postedItemId_userId: {
          postedItemId,
          userId: currentUser.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                id: true,
                profilePictureSecureUrl: true,
                profilePicturePublicId: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      return null;
    }

    // Add ownership flag (will always be true for this query)
    return {
      ...offer,
      isOwner: true,
    };
  } catch (error) {
    console.error('Failed to fetch user offer for posted item:', error);
    return null;
  }
};

/**
 * Check if current user can make an offer on a posted item
 * Returns object with canOffer flag and reason if not allowed
 */
export const canUserMakeOffer = async (
  postedItemId: string
): Promise<{
  canOffer: boolean;
  reason?: string;
  existingOffer?: OfferWithDetails;
}> => {
  try {
    // Get current user
    const { user: currentUser } = await getAuth();

    if (!currentUser) {
      return { canOffer: false, reason: 'Must be logged in to make offers' };
    }

    // Get the posted item to check ownership and status
    const postedItem = await prisma.postedItem.findUnique({
      where: { id: postedItemId },
      select: {
        userId: true,
        status: true,
      },
    });

    if (!postedItem) {
      return { canOffer: false, reason: 'Posted item not found' };
    }

    // Check if user owns the posted item
    if (postedItem.userId === currentUser.id) {
      return {
        canOffer: false,
        reason: 'Cannot make offers on your own items',
      };
    }

    // Check if posted item is still open
    if (postedItem.status !== 'OPEN') {
      return {
        canOffer: false,
        reason: 'This item is no longer accepting offers',
      };
    }

    // Check if user already has an offer
    const existingOffer = await getUserOfferForPostedItem(postedItemId);
    if (existingOffer) {
      return {
        canOffer: false,
        reason: 'You already have an offer on this item',
        existingOffer,
      };
    }

    return { canOffer: true };
  } catch (error) {
    console.error('Failed to check if user can make offer:', error);
    return { canOffer: false, reason: 'Error checking offer eligibility' };
  }
};
