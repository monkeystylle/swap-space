interface SemaphoreOtpResponse {
  message_id: number;
  user_id: number;
  user: string;
  account_id: number;
  account: string;
  recipient: string;
  message: string;
  code: string;
  sender_name: string;
  network: string;
  status: string;
  type: string;
  source: string;
  created_at: string;
  updated_at: string;
}

interface SemaphoreErrorResponse {
  error: string;
  message?: string;
}

export interface SendOtpResult {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;
}

/**
 * Sends an OTP via SMS using Semaphore API
 * @param phoneNumber - Philippine mobile number (e.g., "639998887777")
 * @param message - Message template with {otp} placeholder
 * @param customCode - Optional custom OTP code (if not provided, auto-generated)
 * @returns Promise<SendOtpResult>
 */
export async function sendOtpSms(
  phoneNumber: string,
  message: string = 'Your OTP verification code is {otp}. Please use it within 5 minutes.',
  customCode?: string
): Promise<SendOtpResult> {
  const apiKey = process.env.SEMAPHORE_API_KEY;

  if (!apiKey) {
    console.error('SEMAPHORE_API_KEY is not configured');
    return {
      success: false,
      error: 'SMS service not configured',
    };
  }

  // Validate Philippine mobile number format
  if (!isValidPhilippineNumber(phoneNumber)) {
    return {
      success: false,
      error: 'Invalid Philippine mobile number format',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('apikey', apiKey);
    formData.append('number', phoneNumber);
    formData.append('message', message);

    if (customCode) {
      formData.append('code', customCode);
    }

    const response = await fetch('https://api.semaphore.co/api/v4/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorData = responseData as SemaphoreErrorResponse;
      console.error('Semaphore API error:', errorData);
      return {
        success: false,
        error: errorData.message || errorData.error || 'Failed to send SMS',
      };
    }

    // Semaphore returns an array of responses
    const otpData = Array.isArray(responseData)
      ? responseData[0]
      : responseData;
    const semaphoreResponse = otpData as SemaphoreOtpResponse;

    if (
      semaphoreResponse.status === 'Pending' ||
      semaphoreResponse.status === 'Sent'
    ) {
      return {
        success: true,
        code: semaphoreResponse.code,
        message: 'OTP sent successfully',
      };
    } else {
      return {
        success: false,
        error: `SMS delivery failed with status: ${semaphoreResponse.status}`,
      };
    }
  } catch (error) {
    console.error('Error sending OTP SMS:', error);
    return {
      success: false,
      error: 'Network error occurred while sending SMS',
    };
  }
}

/**
 * Validates if a phone number is a valid Philippine mobile number
 * Accepts formats: 09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX
 * @param phoneNumber - The phone number to validate
 * @returns boolean
 */
export function isValidPhilippineNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Check for different Philippine mobile number formats
  const patterns = [
    /^09\d{9}$/, // 09XXXXXXXXX (11 digits)
    /^639\d{9}$/, // 639XXXXXXXXX (12 digits)
  ];

  return patterns.some(pattern => pattern.test(cleanNumber));
}

/**
 * Normalizes a Philippine phone number to the format expected by Semaphore (639XXXXXXXXX)
 * @param phoneNumber - The phone number to normalize
 * @returns string - Normalized phone number or original if invalid
 */
export function normalizePhilippineNumber(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Convert 09XXXXXXXXX to 639XXXXXXXXX
  if (/^09\d{9}$/.test(cleanNumber)) {
    return '63' + cleanNumber.substring(1);
  }

  // Already in 639XXXXXXXXX format
  if (/^639\d{9}$/.test(cleanNumber)) {
    return cleanNumber;
  }

  // Return original if format is not recognized
  return phoneNumber;
}

/**
 * Formats a normalized phone number for display (e.g., +63 9XX XXX XXXX)
 * @param phoneNumber - Normalized phone number (639XXXXXXXXX)
 * @returns string - Formatted phone number
 */
export function formatPhilippineNumber(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  if (/^639\d{9}$/.test(cleanNumber)) {
    const countryCode = cleanNumber.substring(0, 2); // 63
    const areaCode = cleanNumber.substring(2, 3); // 9
    const firstPart = cleanNumber.substring(3, 6); // XXX
    const secondPart = cleanNumber.substring(6, 9); // XXX
    const thirdPart = cleanNumber.substring(9, 12); // XXXX

    return `+${countryCode} ${areaCode}${firstPart} ${secondPart} ${thirdPart}`;
  }

  return phoneNumber;
}
