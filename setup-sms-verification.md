# SMS Verification Setup Guide

## Overview

SMS verification has been successfully implemented using Semaphore OTP service. Here's what was added:

## ✅ Completed Features

### 1. Database Schema Updates

- Added `phoneNumber` field to User model (unique, optional)
- Added `phoneVerified` boolean field to User model
- Created `OtpVerification` model for tracking SMS verification codes
- Added proper indexes for performance

### 2. Semaphore Integration

- Created `src/lib/semaphore.ts` with OTP sending functionality
- Supports Philippine mobile number validation and formatting
- Handles API errors and response processing

### 3. OTP Verification System

- Created `src/lib/otp-verification.ts` with complete OTP lifecycle management
- Rate limiting protection (5 requests per hour per phone number)
- OTP expiration handling (5 minutes)
- Maximum attempt limits (3 attempts per OTP)
- Automatic cleanup of expired codes

### 4. Server Actions

- `src/features/auth/actions/send-otp.ts` - Sends OTP to phone number
- `src/features/auth/actions/verify-otp.ts` - Verifies OTP code
- Updated `src/features/auth/actions/sign-up.ts` to require phone verification

### 5. Multi-Step Sign-Up Form

- Step 1: User details + phone number input
- Step 2: OTP verification with countdown timer
- Step 3: Success confirmation
- Includes resend OTP functionality
- Back navigation between steps
- Proper error handling and user feedback

## 🚀 Next Steps Required

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add-sms-verification
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Environment Variables

Make sure your `.env` file contains:

```
SEMAPHORE_API_KEY=your_api_key_here
```

## 📱 How It Works

### User Flow:

1. User fills out sign-up form including Philippine phone number
2. System sends OTP via Semaphore SMS API
3. User enters 6-digit verification code
4. System verifies code and creates account
5. User is automatically logged in

### Security Features:

- Phone number uniqueness validation
- Rate limiting (5 OTP requests per hour per number)
- OTP expiration (5 minutes)
- Maximum verification attempts (3 per OTP)
- Automatic cleanup of expired codes

### Error Handling:

- Invalid phone number format
- Rate limiting exceeded
- Expired verification codes
- Invalid verification codes
- Network/API errors
- Database constraint violations

## 🔧 Technical Details

### Rate Limiting Protection

- Maximum 5 OTP requests per phone number per hour
- Prevents spam and abuse
- Graceful error messages to users

### Phone Number Validation

- Supports formats: `09XXXXXXXXX`, `639XXXXXXXXX`, `+639XXXXXXXXX`
- Automatically normalizes to `639XXXXXXXXX` format
- Validates against Philippine mobile number patterns

### OTP Security

- 6-digit numeric codes
- 5-minute expiration
- Maximum 3 verification attempts
- Codes are securely stored with proper indexing

## 🎨 UI/UX Features

### Multi-Step Interface

- Clean stepper-like experience
- Visual feedback with icons and colors
- Real-time countdown timer
- Resend functionality with smart timing
- Back navigation support

### Error States

- Field-level validation errors
- Toast notifications for system messages
- Disabled states during processing
- Clear messaging for rate limits and expiration

### Success States

- Visual confirmation of successful verification
- Automatic redirection after account creation
- Progress indicators throughout the flow

## 🧪 Testing Checklist

### Before Testing:

1. ✅ Run database migration
2. ✅ Generate Prisma client
3. ✅ Set SEMAPHORE_API_KEY in environment
4. ✅ Ensure you have SMS credits in Semaphore account

### Test Cases:

- [ ] Valid Philippine phone number formats
- [ ] Invalid phone number formats
- [ ] Rate limiting (try 6+ requests quickly)
- [ ] OTP expiration (wait 5+ minutes)
- [ ] Invalid OTP codes
- [ ] Maximum attempts exceeded
- [ ] Successful verification flow
- [ ] Resend OTP functionality
- [ ] Back navigation
- [ ] Account creation after verification

## 🛠️ Maintenance

### Periodic Cleanup

The system includes automatic cleanup of expired OTP records, but you may want to run periodic cleanup:

```typescript
import { cleanupExpiredOtps } from '@/lib/otp-verification';

// Run this periodically (e.g., daily cron job)
await cleanupExpiredOtps();
```

### Monitoring

Monitor these metrics:

- OTP delivery success rate
- Verification success rate
- Rate limiting triggers
- Average time to verify

## 🚨 Important Notes

1. **SMS Credits**: Each OTP costs 2 credits per 160-character SMS
2. **Rate Limiting**: The Semaphore OTP endpoint is not rate limited by default, so our application-level rate limiting is crucial
3. **Phone Uniqueness**: Phone numbers must be unique across all users
4. **Verification Window**: Users have 30 minutes after successful OTP verification to complete account creation
5. **Google OAuth**: Users can still sign up with Google OAuth without phone verification

## 🔍 Troubleshooting

### Common Issues:

1. **Prisma Type Errors**: Run `npx prisma generate` after schema changes
2. **SMS Not Received**: Check Semaphore account credits and API key
3. **Rate Limiting**: Wait for the rate limit window to reset (1 hour)
4. **Invalid Phone Format**: Ensure Philippine mobile number format

### Debug Mode:

Check console logs for detailed error messages from:

- Semaphore API responses
- Database operations
- Rate limiting triggers
- OTP verification attempts
