/**
 * Server action for updating a posted item status
 * Allows changing status between OPEN and DONE
 */

'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

// Define validation schema for status update
const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'DONE']),
});

export const updatePostedItemStatus = async (
  postedItemId: string,
  status: 'OPEN' | 'DONE'
): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Validate input
    const validatedInput = updateStatusSchema.parse({ status });

    // Find existing posted item and verify ownership
    const existingPostedItem = await prisma.postedItem.findFirst({
      where: {
        id: postedItemId,
        userId: user.id, // Security: Only allow user to update their own posts
      },
      select: {
        id: true,
        status: true,
        title: true,
      },
    });

    // Check if posted item exists and belongs to user
    if (!existingPostedItem) {
      return toActionState(
        'ERROR',
        'Posted item not found or you do not have permission to update it'
      );
    }

    // Check if status is actually changing
    if (existingPostedItem.status === validatedInput.status) {
      return toActionState(
        'ERROR',
        `Item is already ${validatedInput.status.toLowerCase()}`
      );
    }

    // Update the status in database
    await prisma.postedItem.update({
      where: {
        id: postedItemId,
      },
      data: {
        status: validatedInput.status,
      },
    });

    const statusText = validatedInput.status === 'OPEN' ? 'opened' : 'closed';
    return toActionState('SUCCESS', `Item status updated to ${statusText}`);
  } catch (error) {
    console.error('Failed to update posted item status:', error);
    return fromErrorToActionState(error);
  }
};
