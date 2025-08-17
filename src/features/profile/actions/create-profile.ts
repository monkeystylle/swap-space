/**
 * Server action to create a user profile
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

const createProfileSchema = z.object({
  surname: z
    .string()
    .min(1, 'Surname is required')
    .max(100, 'Surname must be less than 100 characters'),
  givenName: z
    .string()
    .min(1, 'Given name is required')
    .max(100, 'Given name must be less than 100 characters'),
  middleInitial: z
    .string()
    .max(1, 'Middle initial must be 1 character only')
    .regex(/^[A-Za-z]?$/, 'Middle initial must be a single letter')
    .optional()
    .or(z.literal('')),
  street: z
    .string()
    .min(1, 'Street address is required')
    .max(200, 'Street must be less than 200 characters'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  postalCode: z
    .string()
    .min(4, 'Postal code must be exactly 4 digits')
    .max(4, 'Postal code must be exactly 4 digits')
    .regex(/^\d{4}$/, 'Postal code must be exactly 4 digits'),
});

type CreateProfileFormValues = z.infer<typeof createProfileSchema>;

export const createProfile = async (
  values: CreateProfileFormValues
): Promise<ActionState> => {
  try {
    // First, validate the user is authenticated
    const { user } = await getAuthOrRedirect();

    // Validate the input data
    const validatedData = createProfileSchema.parse(values);

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      return toActionState(
        'ERROR',
        'Profile already exists. Use update instead.'
      );
    }

    // Check profile completion
    const isComplete = !!(
      validatedData.surname &&
      validatedData.givenName &&
      validatedData.street &&
      validatedData.city &&
      validatedData.postalCode
    );

    // Create the profile in the database
    await prisma.profile.create({
      data: {
        surname: validatedData.surname,
        givenName: validatedData.givenName,
        middleInitial: validatedData.middleInitial?.trim() || null,
        street: validatedData.street,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        isComplete,
        userId: user.id,
      },
    });

    // Revalidate the profile page
    revalidatePath(`/account/profile`);
    return toActionState('SUCCESS', 'Profile created successfully');
  } catch (error) {
    console.error('Failed to create profile:', error);
    return fromErrorToActionState(error);
  }
};
