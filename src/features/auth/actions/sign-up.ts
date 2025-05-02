'use server';

import { Prisma } from '@prisma/client';

import { z } from 'zod';
import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/utils/to-action-state';
import { hashPassword } from '@/features/password/utils/hash-and-verify';
import { createSession } from '@/lib/session-management';
import { prisma } from '@/lib/prisma';
// import { ticketsPath } from '@/paths';
import { generateRandomToken } from '@/utils/crypto';
import { setSessionCookie } from '../utils/session-cookie';

const signUpSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .max(191, 'Username must be less than 191 characters')
      .refine(value => !value.includes(' '), {
        message: 'Username cannot contain spaces',
      }),
    email: z
      .string()
      .min(1, 'Email is required')
      .max(191, 'Email must be less than 191 characters')
      .email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(191, 'Password must be less than 191 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(191, 'Password must be less than 191 characters'),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export const signUp = async (
  values: SignUpFormValues
): Promise<ActionState> => {
  try {
    const validatedFields = signUpSchema.safeParse(values);

    if (!validatedFields.success) {
      // Handle Zod validation errors
      return fromErrorToActionState(validatedFields.error);
    }

    const { username, email, password } = validatedFields.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    const sessionToken = generateRandomToken();
    const session = await createSession(sessionToken, user.id);

    await setSessionCookie(sessionToken, session.expiresAt);

    return toActionState(
      'SUCCESS',
      'Account created successfully',
      undefined,
      user
    );
  } catch (error) {
    // if code tries to create a user in the database and fails , do this
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return toActionState(
        'ERROR',
        'Either email or username is already in use',
        undefined
      );
    }

    return fromErrorToActionState(error);
  }
};
