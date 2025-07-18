/**
 * Server action for deleting an offer
 * Handles image deletion from Cloudinary and database cleanup
 */

'use server';

import cloudinary from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';
import { usersWallPath } from '@/paths';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

export const deleteOffer = async (offerId: string): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Find the offer with ownership verification
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        userId: user.id, // Security: Only allow user to delete their own offers
      },
    });

    // Check if offer exists and belongs to user
    if (!offer) {
      return toActionState(
        'ERROR',
        'Offer not found or you do not have permission to delete it'
      );
    }

    // Delete image from Cloudinary if it exists
    if (offer.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(offer.imagePublicId);
      } catch (cloudinaryError) {
        // Log but don't fail - we still want to delete from database
        console.warn(
          'Failed to delete image from Cloudinary:',
          cloudinaryError
        );
      }
    }

    // Delete offer from database
    await prisma.offer.delete({
      where: {
        id: offerId,
      },
    });

    revalidatePath(usersWallPath(user.id));
    return toActionState('SUCCESS', 'Offer deleted successfully');
  } catch (error) {
    console.error('Failed to delete offer:', error);
    return fromErrorToActionState(error);
  }

  // Refresh the wall page
  // revalidatePath(wallPath());
  //  revalidatePath(usersWallPath(user.id));
  // return toActionState('SUCCESS', 'Offer deleted successfully');
};
