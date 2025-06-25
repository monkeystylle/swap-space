// This server action handles creating a new posted item with image upload to Cloudinary

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

// Define validation schema for the input
const createPostedItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(191, 'Title must be less than 191 characters'),
  details: z
    .string()
    .min(1, 'Details are required')
    .max(1024, 'Details must be less than 1024 characters'),
});

// Type for our form values
type CreatePostedItemFormValues = z.infer<typeof createPostedItemSchema> & {
  image: File;
};

// Cloudinary response type
interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
}

export const createPostedItem = async (
  values: CreatePostedItemFormValues
): Promise<ActionState> => {
  try {
    // First, validate the user is authenticated
    const { user } = await getAuthOrRedirect();

    // Validate the input data
    const { title, details } = createPostedItemSchema.parse(values);

    // convert the image file to a buffer
    //buffer is a binary data that can be uploaded to cloudinary
    const file = values.image;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image to Cloudinary
    const cloudinaryResponse = await new Promise<CloudinaryResponse>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'posted-items', // This will create a folder in Cloudinary
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

    // Create the posted item in the database
    await prisma.postedItem.create({
      data: {
        title,
        details,
        imagePublicId: cloudinaryResponse.public_id,
        imageSecureUrl: cloudinaryResponse.secure_url,
        userId: user.id,
        status: 'OPEN', // Default status
      },
    });
  } catch (error) {
    console.error('Failed to create posted item:', error);
    return fromErrorToActionState(error);
  }

  // Revalidate the wall page to show the new post
  revalidatePath(wallPath());
  return toActionState('SUCCESS', 'Posted item created successfully');
};
