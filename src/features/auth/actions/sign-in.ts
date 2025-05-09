'use server';

import { z } from 'zod';

import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/utils/to-action-state';
import { verifyPasswordHash } from '@/features/password/utils/hash-and-verify';
import { createSession } from '@/lib/session-management';
import { prisma } from '@/lib/prisma';

import { generateRandomToken } from '@/utils/crypto';
import { setSessionCookie } from '../utils/session-cookie';

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(191, 'Email must be less than 191 characters')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(191, 'Password must be less than 191 characters'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export const signIn = async (
  values: SignInFormValues
): Promise<ActionState> => {
  try {
    const { email, password } = signInSchema.parse(values);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return toActionState('ERROR', 'Incorrect email or password', undefined);
    }

    const validPassword = await verifyPasswordHash(user.passwordHash, password);

    if (!validPassword) {
      return toActionState('ERROR', 'Incorrect email or password', undefined);
    }

    const sessionToken = generateRandomToken();
    const session = await createSession(sessionToken, user.id);

    await setSessionCookie(sessionToken, session.expiresAt);

    return toActionState('SUCCESS', 'Signed in successfully', undefined, user);
  } catch (error) {
    return fromErrorToActionState(error);
  }
};
