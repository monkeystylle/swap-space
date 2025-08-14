/**
 * Server action to get user profile by user ID
 */

'use server';

import { prisma } from '@/lib/prisma';
import type { Profile } from '../queries/profile.types';

export const getProfileAction = async (
  userId: string
): Promise<Profile | null> => {
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: userId,
      },
    });

    return profile;
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
};
