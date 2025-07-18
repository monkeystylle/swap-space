/**
 * Server action for updating a posted item
 * Handles selective updates for title, details, and/or image with Cloudinary management
 */

'use server';

import { z } from 'zod';
import cloudinary from '@/lib/cloudinary';

import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';

import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

// Define validation schema for optional form fields
const updatePostedItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(191, 'Title must be less than 191 characters')
    .optional(),
  details: z
    .string()
    .min(1, 'Details cannot be empty')
    .max(1024, 'Details must be less than 1024 characters')
    .optional(),
});

// Type for form input data
type UpdatePostedItemInput = z.infer<typeof updatePostedItemSchema> & {
  image?: File; // Optional new image file
};

// Cloudinary response type
interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
}

export const updatePostedItem = async (
  postedItemId: string,
  input: UpdatePostedItemInput
): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Ensure at least one field is being updated
    if (!input.title && !input.details && !input.image) {
      return toActionState('ERROR', 'At least one field must be updated');
    }

    // Find existing posted item and verify ownership
    const existingPostedItem = await prisma.postedItem.findFirst({
      where: {
        id: postedItemId,
        userId: user.id, // Security: Only allow user to update their own posts
      },
    });

    // Check if posted item exists and belongs to user
    if (!existingPostedItem) {
      return toActionState(
        'ERROR',
        'Posted item not found or you do not have permission to update it'
      );
    }

    // Validate input data against schema
    // This will throw an error if validation fails
    const validatedInput = updatePostedItemSchema.parse(input);

    // Prepare update data with fallback values to ensure required fields are never empty
    const updateData: {
      title: string; // Always has a value
      details: string; // Always has a value
      imagePublicId?: string;
      imageSecureUrl?: string;
    } = {
      title: validatedInput.title ?? existingPostedItem.title,
      details: validatedInput.details ?? existingPostedItem.details,
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
              folder: 'posted-items',
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
      if (existingPostedItem.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existingPostedItem.imagePublicId);
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

    // Update the posted item in database
    await prisma.postedItem.update({
      where: {
        id: postedItemId,
      },
      data: updateData,
    });

    return toActionState('SUCCESS', 'Posted item updated successfully');
  } catch (error) {
    console.error('Failed to update posted item:', error);
    return fromErrorToActionState(error);
  }

  // Refresh the wall page to show updated content
  // revalidatePath(wallPath());
  // return toActionState('SUCCESS', 'Posted item updated successfully');
};
