/**
 * Server action for deleting a posted item
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

export const deletePostedItem = async (
  postedItemId: string
): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Find the posted item with ownership verification
    const postedItem = await prisma.postedItem.findFirst({
      where: {
        id: postedItemId,
        userId: user.id, // Security: Only allow user to delete their own posts
      },
    });

    // Check if posted item exists and belongs to user
    if (!postedItem) {
      return toActionState(
        'ERROR',
        'Posted item not found or you do not have permission to delete it'
      );
    }

    // Delete image from Cloudinary if it exists
    if (postedItem.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(postedItem.imagePublicId);
      } catch (cloudinaryError) {
        // Log but don't fail - we still want to delete from database
        console.warn(
          'Failed to delete image from Cloudinary:',
          cloudinaryError
        );
      }
    }

    // Delete from database (this will cascade delete all related offers)
    await prisma.postedItem.delete({
      where: {
        id: postedItemId,
      },
    });
    revalidatePath(usersWallPath(user.id));
    return toActionState('SUCCESS', 'Posted item deleted successfully');
  } catch (error) {
    console.error('Failed to delete posted item:', error);
    return fromErrorToActionState(error);
  }

  // Refresh the wall page
  // revalidatePath(wallPath());
  // return toActionState('SUCCESS', 'Posted item deleted successfully');
};
