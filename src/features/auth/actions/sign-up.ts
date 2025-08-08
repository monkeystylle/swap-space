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
import { isPhoneNumberVerified } from '@/lib/otp-verification';
import {
  isValidPhilippineNumber,
  normalizePhilippineNumber,
} from '@/lib/semaphore';

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
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .refine(value => isValidPhilippineNumber(value), {
        message:
          'Please enter a valid Philippine mobile number (e.g., 09123456789)',
      }),
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
    // Use parse directly - any validation errors will be caught in the catch block
    const { username, email, phoneNumber, password } =
      signUpSchema.parse(values);

    const normalizedPhone = normalizePhilippineNumber(phoneNumber);

    // Check if phone number has been verified recently (within 30 minutes)
    const phoneVerified = await isPhoneNumberVerified(normalizedPhone, 30);

    if (!phoneVerified) {
      return toActionState(
        'ERROR',
        'Phone number must be verified before creating account. Please verify your phone number first.',
        undefined
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phoneNumber: normalizedPhone,
        phoneVerified: true,
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
    // if code tries to create a user in the database and fails ,
    // This will catch both ZodErrors and Prisma errors
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      // Check which field caused the unique constraint violation
      const target = error.meta?.target as string[];
      if (target?.includes('phoneNumber')) {
        return toActionState(
          'ERROR',
          'This phone number is already registered with another account',
          undefined
        );
      } else if (target?.includes('email')) {
        return toActionState(
          'ERROR',
          'This email address is already registered with another account',
          undefined
        );
      } else if (target?.includes('username')) {
        return toActionState(
          'ERROR',
          'This username is already taken. Please choose a different username.',
          undefined
        );
      } else {
        return toActionState(
          'ERROR',
          'Either email, username, or phone number is already in use',
          undefined
        );
      }
    }

    return fromErrorToActionState(error);
  }
};
