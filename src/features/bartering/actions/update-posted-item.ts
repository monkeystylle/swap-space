/**
 * Server action for updating a posted item
 * Handles text updates and optional image replacement
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

// Input validation schema
const updatePostedItemSchema = z.object({
  postedItemId: z.string().min(1, 'Posted item ID is required'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(191, 'Title must be less than 191 characters'),
  details: z
    .string()
    .min(1, 'Details are required')
    .max(1024, 'Details must be less than 1024 characters'),
});

// Type for function parameters
type UpdatePostedItemInput = z.infer<typeof updatePostedItemSchema> & {
  image?: File; // Optional new image
};

// Cloudinary response type
interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
}

export const updatePostedItem = async (
  input: UpdatePostedItemInput
): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Validate input
    const { postedItemId, title, details } =
      updatePostedItemSchema.parse(input);

    // Find the posted item with ownership verification
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

    // Prepare update data with text fields
    const updateData: {
      title: string;
      details: string;
      imagePublicId?: string;
      imageSecureUrl?: string;
    } = {
      title,
      details,
    };

    // Handle image replacement if new image is provided
    if (input.image) {
      // Convert image file to buffer
      const file = input.image;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload new image to Cloudinary first
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

      // Only after successful upload, delete the old image
      if (existingPostedItem.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existingPostedItem.imagePublicId);
        } catch (cloudinaryError) {
          // Log warning but don't fail the update
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
    const updatedPostedItem = await prisma.postedItem.update({
      where: {
        id: postedItemId,
      },
      data: updateData,
    });

    // Revalidate the wall page
    revalidatePath(wallPath());

    return toActionState(
      'SUCCESS',
      'Posted item updated successfully',
      undefined,
      updatedPostedItem
    );
  } catch (error) {
    console.error('Failed to update posted item:', error);
    return fromErrorToActionState(error);
  }
};
