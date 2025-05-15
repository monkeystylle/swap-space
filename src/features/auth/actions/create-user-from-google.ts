'use server';

import { prisma } from '@/lib/prisma';
import { ActionState, toActionState } from '@/utils/to-action-state';

export const createUserFromGoogle = async (
  googleId: string,
  email: string,
  name: string
): Promise<ActionState> => {
  try {
    // Generate a username from the name (remove spaces, lowercase)
    const baseUsername = name.replace(/\s+/g, '').toLowerCase();

    // Check if username exists, if so, add a random suffix
    const existingUser = await prisma.user.findUnique({
      where: { username: baseUsername },
    });

    const username = existingUser
      ? `${baseUsername}${Math.floor(Math.random() * 10000)}`
      : baseUsername;

    // Create the user with Google info
    const user = await prisma.user.create({
      data: {
        username,
        email,
        googleId,
        passwordHash: 'GOOGLE_OAUTH_USER', // Placeholder since we don't need a password
      },
    });

    return toActionState(
      'SUCCESS',
      'Google account linked successfully',
      undefined,
      user
    );
  } catch (error) {
    console.error('Failed to create user from Google:', error);
    return toActionState(
      'ERROR',
      'Failed to create account from Google',
      undefined
    );
  }
};
