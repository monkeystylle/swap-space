'use server';

import { prisma } from '@/lib/prisma';
import { ActionState, toActionState } from '@/utils/to-action-state';

export const createUserFromGoogle = async (
  googleId: string,
  email: string,
  name: string
): Promise<ActionState> => {
  try {
    // First check if a user with this email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      // If user exists but doesn't have a googleId, update the user to add the googleId
      if (!existingUserByEmail.googleId) {
        const updatedUser = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: { googleId },
        });

        return toActionState(
          'SUCCESS',
          'Google account linked to existing account',
          undefined,
          updatedUser
        );
      } else {
        // User exists with both email and googleId (shouldn't happen normally)
        return toActionState(
          'SUCCESS',
          'Signed in with Google',
          undefined,
          existingUserByEmail
        );
      }
    }

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
