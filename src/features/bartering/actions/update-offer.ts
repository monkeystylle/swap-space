/**
 * Server action for updating an offer
 * Handles selective updates for content and/or image with Cloudinary management
 */

'use server';

import { z } from 'zod';
import cloudinary from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';
import { wallPath } from '@/paths';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

// Define validation schema for optional form fields
const updateOfferSchema = z.object({
  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(1024, 'Content must be less than 1024 characters')
    .optional(),
});

// Type for form input data
type UpdateOfferInput = z.infer<typeof updateOfferSchema> & {
  image?: File; // Optional new image file
};

// Cloudinary response type
interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
}

export const updateOffer = async (
  offerId: string,
  input: UpdateOfferInput
): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Ensure at least one field is being updated
    if (!input.content && !input.image) {
      return toActionState('ERROR', 'At least one field must be updated');
    }

    // Find existing offer and verify ownership
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        userId: user.id, // Security: Only allow user to update their own offers
      },
    });

    // Check if offer exists and belongs to user
    if (!existingOffer) {
      return toActionState(
        'ERROR',
        'Offer not found or you do not have permission to update it'
      );
    }

    // Validate input data against schema
    const validatedInput = updateOfferSchema.parse(input);

    // Prepare update data with fallback value to ensure required field is never empty
    const updateData: {
      content: string; // Always has a value
      imagePublicId?: string;
      imageSecureUrl?: string;
    } = {
      content: validatedInput.content ?? existingOffer.content,
    };

    // Handle image replacement if new image is provided
    if (input.image) {
      // Convert image file to buffer for Cloudinary upload
      const file = input.image;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload new image to Cloudinary first (safer than deleting old image first)
      const cloudinaryResponse = await new Promise<CloudinaryResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'offers',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve(result);
              else reject(new Error('Upload failed'));
            }
          );

          uploadStream.end(buffer);
        }
      );

      // Delete old image from Cloudinary after successful upload
      if (existingOffer.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existingOffer.imagePublicId);
        } catch (cloudinaryError) {
          // Log warning but don't fail the update - old image cleanup is not critical
          console.warn(
            'Failed to delete old image from Cloudinary:',
            cloudinaryError
          );
        }
      }

      // Add new image data to update
      updateData.imagePublicId = cloudinaryResponse.public_id;
      updateData.imageSecureUrl = cloudinaryResponse.secure_url;
    }

    // Update the offer in database
    await prisma.offer.update({
      where: {
        id: offerId,
      },
      data: updateData,
    });
  } catch (error) {
    console.error('Failed to update offer:', error);
    return fromErrorToActionState(error);
  }

  // Refresh the wall page to show updated content
  revalidatePath(wallPath());
  return toActionState('SUCCESS', 'Offer updated successfully');
};
