'use server';

import { z } from 'zod';
import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/utils/to-action-state';
import { verifyOtpCode } from '@/lib/otp-verification';
import { isValidPhilippineNumber } from '@/lib/semaphore';

const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine(value => isValidPhilippineNumber(value), {
      message: 'Please enter a valid Philippine mobile number',
    }),
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export const verifyOtp = async (
  values: VerifyOtpFormValues
): Promise<ActionState> => {
  try {
    const { phoneNumber, code } = verifyOtpSchema.parse(values);

    const result = await verifyOtpCode(phoneNumber, code);

    if (!result.success) {
      return toActionState('ERROR', result.message, undefined, {
        canRetry: result.canRetry,
        remainingAttempts: result.remainingAttempts,
        expiresAt: result.expiresAt,
      });
    }

    return toActionState('SUCCESS', result.message, undefined, {
      phoneVerified: true,
    });
  } catch (error) {
    return fromErrorToActionState(error);
  }
};
