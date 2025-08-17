/**
 * Query to get user profile with user details by user ID
 */

import { prisma } from '@/lib/prisma';

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
