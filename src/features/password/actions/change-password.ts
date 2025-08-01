'use server';

import { z } from 'zod';
import { getAuth } from '@/features/auth/queries/get-auth';
import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/utils/to-action-state';
import {
  hashPassword,
  verifyPasswordHash,
} from '@/features/password/utils/hash-and-verify';
import { prisma } from '@/lib/prisma';

const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(191, 'Password must be less than 191 characters'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .max(191, 'Password must be less than 191 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(data => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const changePassword = async (
  values: ChangePasswordFormValues
): Promise<ActionState> => {
  try {
    // Get current authenticated user
    const auth = await getAuth();

    if (!auth.user) {
      return toActionState(
        'ERROR',
        'You must be logged in to change your password'
      );
    }

    // Check if user is Google OAuth user
    if (auth.user.passwordHash === 'GOOGLE_OAUTH_USER') {
      return toActionState(
        'ERROR',
        'Password changes are not available for Google accounts'
      );
    }

    // Validate input
    const { oldPassword, newPassword } = changePasswordSchema.parse(values);

    // Verify current password
    const isCurrentPasswordValid = await verifyPasswordHash(
      auth.user.passwordHash,
      oldPassword
    );

    if (!isCurrentPasswordValid) {
      return {
        status: 'ERROR' as const,
        message: 'Current password is incorrect',
        fieldErrors: {
          oldPassword: ['Current password is incorrect'],
        },
        timestamp: Date.now(),
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return toActionState('SUCCESS', 'Password changed successfully');
  } catch (error) {
    return fromErrorToActionState(error);
  }
};
