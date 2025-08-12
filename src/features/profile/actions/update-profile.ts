/**
 * Server action to update a user profile
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  ActionState,
  toActionState,
  fromErrorToActionState,
} from '@/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';

const updateProfileSchema = z.object({
  surname: z
    .string()
    .min(1, 'Surname is required')
    .max(100, 'Surname must be less than 100 characters')
    .optional(),
  givenName: z
    .string()
    .min(1, 'Given name is required')
    .max(100, 'Given name must be less than 100 characters')
    .optional(),
  middleInitial: z
    .string()
    .max(5, 'Middle initial must be less than 5 characters')
    .optional()
    .or(z.literal('')),
  street: z
    .string()
    .min(1, 'Street address is required')
    .max(200, 'Street must be less than 200 characters')
    .optional(),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters')
    .optional(),
  province: z
    .string()
    .min(1, 'Province is required')
    .max(100, 'Province must be less than 100 characters')
    .optional(),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code must be less than 20 characters')
    .optional(),
  country: z
    .string()
    .max(100, 'Country must be less than 100 characters')
    .optional(),
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const updateProfile = async (
  values: UpdateProfileFormValues
): Promise<ActionState> => {
  try {
    // First, validate the user is authenticated
    const { user } = await getAuthOrRedirect();

    // Validate the input data
    const validatedData = updateProfileSchema.parse(values);

    // Get current profile to check completion
    const currentProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!currentProfile) {
      return toActionState(
        'ERROR',
        'Profile not found. Create a profile first.'
      );
    }

    // Prepare update data
    const updateData: Partial<{
      surname: string;
      givenName: string;
      middleInitial: string | null;
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
      isComplete: boolean;
    }> = {};

    // Only update provided fields
    if (validatedData.surname !== undefined)
      updateData.surname = validatedData.surname;
    if (validatedData.givenName !== undefined)
      updateData.givenName = validatedData.givenName;
    if (validatedData.middleInitial !== undefined) {
      updateData.middleInitial = validatedData.middleInitial?.trim() || null;
    }
    if (validatedData.street !== undefined)
      updateData.street = validatedData.street;
    if (validatedData.city !== undefined) updateData.city = validatedData.city;
    if (validatedData.province !== undefined)
      updateData.province = validatedData.province;
    if (validatedData.postalCode !== undefined)
      updateData.postalCode = validatedData.postalCode;
    if (validatedData.country !== undefined)
      updateData.country = validatedData.country;

    // Calculate profile completion after update
    const updatedProfile = { ...currentProfile, ...updateData };
    const isComplete = !!(
      updatedProfile.profilePictureSecureUrl &&
      updatedProfile.surname &&
      updatedProfile.givenName &&
      updatedProfile.street &&
      updatedProfile.city &&
      updatedProfile.province &&
      updatedProfile.postalCode
    );

    updateData.isComplete = isComplete;

    // Update the profile in the database
    await prisma.profile.update({
      where: { userId: user.id },
      data: updateData,
    });

    // Revalidate the profile page
    revalidatePath(`/account/profile`);
    return toActionState('SUCCESS', 'Profile updated successfully');
  } catch (error) {
    console.error('Failed to update profile:', error);
    return fromErrorToActionState(error);
  }
};
