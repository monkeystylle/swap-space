/**
 * Server action for creating an offer on a posted item
 * Handles content validation, optional image upload, and business logic checks
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
import { createNotification } from '@/features/notification/actions/create-notification';
import { sendOfferNotificationEmail } from '@/features/notification/services/send-offer-notification-email';
import { getBaseUrl } from '@/utils/url';

// Define validation schema for offer content
const createOfferSchema = z.object({
  content: z
    .string()
    .min(1, 'Offer content is required')
    .max(1024, 'Offer content must be less than 1024 characters'),
});

// Type for offer input data
type CreateOfferInput = z.infer<typeof createOfferSchema> & {
  image?: File; // Optional image for the offer
};

// Cloudinary response type
interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
}

export const createOffer = async (
  postedItemId: string,
  input: CreateOfferInput
): Promise<ActionState> => {
  try {
    // Authenticate user
    const { user } = await getAuthOrRedirect();

    // Validate form input
    const { content } = createOfferSchema.parse(input);

    // Check if the posted item exists and is available for offers
    const postedItem = await prisma.postedItem.findUnique({
      where: { id: postedItemId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        }, // Include owner info for notifications
      },
    });

    // Validate posted item exists
    if (!postedItem) {
      return toActionState('ERROR', 'Posted item not found');
    }

    // Check if posted item is still open for offers
    if (postedItem.status !== 'OPEN') {
      return toActionState(
        'ERROR',
        'This posted item is no longer accepting offers'
      );
    }

    // Prevent user from offering on their own posted item
    if (postedItem.user.id === user.id) {
      return toActionState(
        'ERROR',
        'You cannot make an offer on your own posted item'
      );
    }

    // Check if user already has an offer on this posted item
    const existingOffer = await prisma.offer.findUnique({
      where: {
        postedItemId_userId: {
          postedItemId: postedItemId,
          userId: user.id,
        },
      },
    });

    if (existingOffer) {
      return toActionState(
        'ERROR',
        'You have already made an offer on this item'
      );
    }

    // Prepare offer data
    const offerData: {
      content: string;
      postedItemId: string;
      userId: string;
      imagePublicId?: string;
      imageSecureUrl?: string;
    } = {
      content,
      postedItemId,
      userId: user.id,
    };

    // Handle optional image upload
    if (input.image) {
      // Convert image file to buffer for Cloudinary upload
      const file = input.image;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload image to Cloudinary
      const cloudinaryResponse = await new Promise<CloudinaryResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'offers', // Different folder for offer images
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

      // Add image data to offer
      offerData.imagePublicId = cloudinaryResponse.public_id;
      offerData.imageSecureUrl = cloudinaryResponse.secure_url;
    }

    // Create the offer in database
    const createdOffer = await prisma.offer.create({
      data: offerData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Send email notification to posted item owner
    try {
      await sendOfferNotificationEmail(
        postedItem.user.username || 'User',
        postedItem.user.email,
        createdOffer.user?.username || 'Someone',
        postedItem.title,
        content,
        `${getBaseUrl()}/item/${postedItemId}`
      );
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the offer creation if email fails
    }

    // Create in-app notification for posted item owner
    try {
      await createNotification({
        type: 'OFFER_RECEIVED',
        title: 'New offer on your item!',
        message: `${createdOffer.user?.username || 'Someone'} made an offer on "${postedItem.title}": "${content}"`,
        userId: postedItem.user.id,
        postedItemId: postedItemId,
        offerId: createdOffer.id,
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the offer creation if notification fails
    }

    return toActionState('SUCCESS', 'Offer created successfully');
  } catch (error) {
    console.error('Failed to create offer:', error);
    return fromErrorToActionState(error);
  }

  // Refresh the wall page to show the new offer
  // revalidatePath(wallPath());
  // return toActionState('SUCCESS', 'Offer created successfully');
};
