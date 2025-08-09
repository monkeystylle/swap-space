'use server';

import { z } from 'zod';
import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/utils/to-action-state';
import { sendOtpToPhone } from '@/lib/otp-verification';
import { isValidPhilippineNumber } from '@/lib/semaphore';

const sendOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine(value => isValidPhilippineNumber(value), {
      message:
        'Please enter a valid Philippine mobile number (e.g., 09123456789)',
    }),
});

type SendOtpFormValues = z.infer<typeof sendOtpSchema>;

export const sendOtp = async (
  values: SendOtpFormValues
): Promise<ActionState> => {
  try {
    const { phoneNumber } = sendOtpSchema.parse(values);

    const result = await sendOtpToPhone(phoneNumber);

    if (!result.success) {
      return toActionState('ERROR', result.message, undefined, {
        rateLimited: result.rateLimited,
        remainingRequests: result.remainingRequests,
        nextRequestAllowedAt: result.nextRequestAllowedAt, // ADDED
      });
    }

    return toActionState('SUCCESS', result.message, undefined, {
      expiresAt: result.expiresAt,
      remainingRequests: result.remainingRequests,
    });
  } catch (error) {
    return fromErrorToActionState(error);
  }
};
