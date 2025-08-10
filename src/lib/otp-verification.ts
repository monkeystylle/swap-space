'use server';

import { prisma } from '@/lib/prisma';
import { sendOtpSms, normalizePhilippineNumber } from '@/lib/semaphore';

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 60; // 1 hour
const MAX_OTP_REQUESTS_PER_WINDOW = 5;

// UPDATED INTERFACE
export interface OtpVerificationResult {
  success: boolean;
  message: string;
  canRetry?: boolean;
  remainingAttempts?: number;
  expiresAt?: Date;
  isRateLimited?: boolean; // ADDED
  nextRequestAllowedAt?: Date; // ADDED
}

// UPDATED INTERFACE
export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  rateLimited?: boolean;
  remainingRequests?: number;
  nextRequestAllowedAt?: Date; // ADDED
}

/**
 * Sends an OTP to a phone number with rate limiting protection
 */
export async function sendOtpToPhone(
  phoneNumber: string,
  userId?: string
): Promise<SendOtpResult> {
  try {
    const normalizedPhone = normalizePhilippineNumber(phoneNumber);

    // Check rate limiting - count OTP requests in the last hour
    const oneHourAgo = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
    );
    const recentRequests = await prisma.otpVerification.count({
      where: {
        phoneNumber: normalizedPhone,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentRequests >= MAX_OTP_REQUESTS_PER_WINDOW) {
      // ENHANCED: Calculate when next request is allowed
      const oldestRequest = await prisma.otpVerification.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          createdAt: {
            gte: oneHourAgo,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const nextAllowedAt = oldestRequest
        ? new Date(
            oldestRequest.createdAt.getTime() +
              RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
          )
        : new Date(Date.now() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

      return {
        success: false,
        message: `Too many OTP requests. Please wait before requesting another code.`,
        rateLimited: true,
        remainingRequests: 0,
        nextRequestAllowedAt: nextAllowedAt, // ADDED
      };
    }

    // Clean up expired OTP records for this phone number
    await prisma.otpVerification.deleteMany({
      where: {
        phoneNumber: normalizedPhone,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Generate OTP code (6 digits)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Send SMS via Semaphore
    const smsResult = await sendOtpSms(
      normalizedPhone,
      `Your SwapSpace verification code is {otp}. This code will expire in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`,
      otpCode
    );

    if (!smsResult.success) {
      return {
        success: false,
        message: smsResult.error || 'Failed to send SMS verification code',
      };
    }

    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        phoneNumber: normalizedPhone,
        code: otpCode,
        expiresAt,
        userId: userId || null,
      },
    });

    return {
      success: true,
      message: `Verification code sent to ${phoneNumber}`,
      expiresAt,
      remainingRequests: MAX_OTP_REQUESTS_PER_WINDOW - recentRequests - 1,
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'An error occurred while sending verification code',
    };
  }
}

/**
 * Verifies an OTP code for a phone number
 */
export async function verifyOtpCode(
  phoneNumber: string,
  code: string,
  userId?: string
): Promise<OtpVerificationResult> {
  try {
    const normalizedPhone = normalizePhilippineNumber(phoneNumber);

    // Find the most recent, non-expired, non-verified OTP for this phone number
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return {
        success: false,
        message: 'No valid verification code found. Please request a new code.',
        canRetry: true,
      };
    }

    // Check if max attempts reached
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      // Mark as expired by setting expiresAt to past
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      return {
        success: false,
        message:
          'Maximum verification attempts exceeded. Please request a new code.',
        canRetry: true,
        remainingAttempts: 0,
      };
    }

    // Increment attempts
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    // Check if code matches
    if (otpRecord.code !== code.trim()) {
      const remainingAttempts = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);

      return {
        success: false,
        message:
          remainingAttempts > 0
            ? `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
            : 'Invalid verification code. No attempts remaining.',
        canRetry: remainingAttempts > 0,
        remainingAttempts,
        expiresAt: otpRecord.expiresAt,
      };
    }

    // Code is correct - mark as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
        userId: userId || otpRecord.userId,
      },
    });

    // Clean up other OTP records for this phone number
    await prisma.otpVerification.deleteMany({
      where: {
        phoneNumber: normalizedPhone,
        id: { not: otpRecord.id },
      },
    });

    return {
      success: true,
      message: 'Phone number verified successfully!',
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'An error occurred during verification',
    };
  }
}

/**
 * Checks if a phone number has been recently verified
 */
export async function isPhoneNumberVerified(
  phoneNumber: string,
  withinMinutes: number = 30
): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhilippineNumber(phoneNumber);
    const timeWindow = new Date(Date.now() - withinMinutes * 60 * 1000);

    const verifiedRecord = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        verified: true,
        createdAt: {
          gte: timeWindow,
        },
      },
    });

    return !!verifiedRecord;
  } catch (error) {
    console.error('Error checking phone verification status:', error);
    return false;
  }
}

/**
 * Cleans up expired OTP records (should be run periodically)
 */
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}

/**
 * Gets remaining OTP attempts for a phone number
 */
export async function getRemainingOtpAttempts(
  phoneNumber: string
): Promise<number> {
  try {
    const normalizedPhone = normalizePhilippineNumber(phoneNumber);

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return MAX_OTP_ATTEMPTS;
    }

    return Math.max(0, MAX_OTP_ATTEMPTS - otpRecord.attempts);
  } catch (error) {
    console.error('Error getting remaining OTP attempts:', error);
    return 0;
  }
}
