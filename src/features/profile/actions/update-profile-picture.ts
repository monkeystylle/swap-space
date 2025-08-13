/**
 * Server action to update user profile picture
 */

'use server';

import { revalidatePath } from 'next/cache';
import cloudinary from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

// Cloudinary response type
interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
}

export const updateProfilePicture = async (
  image: File
): Promise<ActionState> => {
  try {
    // First, validate the user is authenticated
    const { user } = await getAuthOrRedirect();

    // Convert the image file to a buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image to Cloudinary
    const cloudinaryResponse = await new Promise<CloudinaryResponse>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'profile-pictures',
            resource_type: 'image',
            transformation: [
              {
                width: 400,
                height: 400,
                crop: 'fill',
                gravity: 'face', // ✅ Keep face detection - essential for profile pics
              },
            ],
            // ✅ Fixed settings instead of 'auto' saves 1 transformation
            format: 'jpg',
            quality: 80,
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

    // Find or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      // Create new profile with just the picture
      profile = await prisma.profile.create({
        data: {
          profilePicturePublicId: cloudinaryResponse.public_id,
          profilePictureSecureUrl: cloudinaryResponse.secure_url,
          userId: user.id,
          isComplete: false, // Will be false until other details are filled
        },
      });
    } else {
      // Delete old profile picture from Cloudinary if exists
      if (profile.profilePicturePublicId) {
        try {
          await cloudinary.uploader.destroy(profile.profilePicturePublicId);
        } catch (error) {
          console.warn('Failed to delete old profile picture:', error);
        }
      }

      // Calculate profile completion after picture update
      const isComplete = !!(
        profile.surname &&
        profile.givenName &&
        profile.street &&
        profile.city &&
        profile.province &&
        profile.postalCode
      );

      // Update existing profile
      profile = await prisma.profile.update({
        where: { userId: user.id },
        data: {
          profilePicturePublicId: cloudinaryResponse.public_id,
          profilePictureSecureUrl: cloudinaryResponse.secure_url,
          isComplete,
        },
      });
    }

    // Revalidate the profile page
    revalidatePath(`/account/profile`);
    return toActionState('SUCCESS', 'Profile picture updated successfully');
  } catch (error) {
    console.error('Failed to update profile picture:', error);
    return fromErrorToActionState(error);
  }
};
