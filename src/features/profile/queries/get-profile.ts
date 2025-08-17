/**
 * Server function to get user profile by user ID
 * Similar to bartering queries pattern
 */

'use server';

import { prisma } from '@/lib/prisma';
import type { Profile } from './profile.types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
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
