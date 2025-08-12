/**
 * Query to get user profile by user ID
 */

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

export const getProfileWithUser = async (userId: string) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return profile;
  } catch (error) {
    console.error('Failed to get profile with user:', error);
    return null;
  }
};
