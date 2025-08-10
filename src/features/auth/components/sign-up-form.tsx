'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/password-input';
import { signUp } from '../actions/sign-up';
import { sendOtp } from '../actions/send-otp';
import { verifyOtp } from '../actions/verify-otp';
import { homePath } from '@/paths';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/ui/google-icon';
import { isValidPhilippineNumber } from '@/lib/semaphore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock, Shield, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Step 1: Initial sign-up form
const step1Schema = z
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
          'Please enter a valid Philippine mobile number (09XXXXXXXXX, +639XXXXXXXXX, or 639XXXXXXXXX)',
      }),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(191, 'Password must be less than 191 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Step 2: OTP verification
const step2Schema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

type Step1FormValues = z.infer<typeof step1Schema>;
type Step2FormValues = z.infer<typeof step2Schema>;

type SignUpStep = 'details' | 'verification' | 'completed';

// Verification error states
interface VerificationState {
  error: string | null;
  remainingAttempts: number | null;
  isExpired: boolean;
  isRateLimited: boolean;
  canRetry: boolean;
}

const SignUpForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SignUpStep>('details');
  const [userDetails, setUserDetails] = useState<Step1FormValues | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [resendTimeRemaining, setResendTimeRemaining] = useState<number>(0);
  const [verificationState, setVerificationState] = useState<VerificationState>(
    {
      error: null,
      remainingAttempts: null,
      isExpired: false,
      isRateLimited: false,
      canRetry: true,
    }
  );
  const [hasShownExpiryToast, setHasShownExpiryToast] = useState(false);

  // Step 1 form
  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Step 2 form
  const step2Form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      code: '',
    },
  });

  // Timer for OTP expiration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (otpExpiresAt && currentStep === 'verification') {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = otpExpiresAt.getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

        setTimeRemaining(remaining);

        // Handle expiration - only update state once
        if (remaining === 0 && !hasShownExpiryToast) {
          setVerificationState(prev => ({
            ...prev,
            isExpired: true,
            error: 'Verification code has expired. Please request a new code.',
          }));
          setHasShownExpiryToast(true);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpExpiresAt, currentStep, hasShownExpiryToast]);

  // Timer for resend cooldown (60 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (resendTimeRemaining > 0 && currentStep === 'verification') {
      interval = setInterval(() => {
        setResendTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimeRemaining, currentStep]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetVerificationState = () => {
    setVerificationState({
      error: null,
      remainingAttempts: null,
      isExpired: false,
      isRateLimited: false,
      canRetry: true,
    });
    setHasShownExpiryToast(false);
  };

  // Step 1: Handle form submission and send OTP
  const onStep1Submit = async (values: Step1FormValues) => {
    try {
      const result = await sendOtp({ phoneNumber: values.phoneNumber });

      if (result.status === 'SUCCESS') {
        setUserDetails(values);
        setCurrentStep('verification');
        resetVerificationState();
        // Reset step 2 form to clear any previous verification code
        step2Form.reset({ code: '' });
        if (result.data?.expiresAt) {
          const expiryDate = new Date(result.data.expiresAt);
          setOtpExpiresAt(expiryDate);
          // Initialize timer immediately
          const now = new Date().getTime();
          const remaining = Math.max(
            0,
            Math.floor((expiryDate.getTime() - now) / 1000)
          );
          setTimeRemaining(remaining);
        }
        // Start 60-second resend cooldown
        setResendTimeRemaining(60);
      } else {
        toast.error(result.message || 'Failed to send verification code');

        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              step1Form.setError(field as keyof Step1FormValues, {
                type: 'manual',
                message: errors[0],
              });
            }
          });
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    }
  };

  // Step 2: Handle OTP verification and complete registration
  const onStep2Submit = async (values: Step2FormValues) => {
    if (!userDetails) {
      toast.error('Session expired. Please start over.');
      setCurrentStep('details');
      return;
    }

    // Clear previous errors
    resetVerificationState();
    step2Form.clearErrors();

    try {
      // First verify the OTP
      const verifyResult = await verifyOtp({
        phoneNumber: userDetails.phoneNumber,
        code: values.code,
      });

      if (verifyResult.status !== 'SUCCESS') {
        // Update verification state for UI display
        setVerificationState({
          error: verifyResult.message || 'Invalid verification code',
          remainingAttempts: verifyResult.data?.remainingAttempts || null,
          isExpired: verifyResult.data?.expiresAt
            ? new Date(verifyResult.data.expiresAt) < new Date()
            : false,
          isRateLimited: false, // This would come from the backend
          canRetry: verifyResult.data?.canRetry ?? true,
        });

        // Set form field errors if any
        if (verifyResult.fieldErrors) {
          Object.entries(verifyResult.fieldErrors).forEach(
            ([field, errors]) => {
              if (errors && errors.length > 0) {
                step2Form.setError(field as keyof Step2FormValues, {
                  type: 'manual',
                  message: errors[0],
                });
              }
            }
          );
        }
        return;
      }

      // OTP verified, now create the account
      const signUpResult = await signUp(userDetails);

      if (signUpResult.status === 'SUCCESS') {
        toast.success(signUpResult.message);
        setCurrentStep('completed');
        // Redirect after a short delay to show success message
        setTimeout(() => {
          router.push(homePath());
        }, 2000);
      } else {
        toast.error(signUpResult.message || 'Failed to create account');
        // Go back to step 1 if there's an issue with account creation
        setCurrentStep('details');
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        error: 'An unexpected error occurred during verification',
      }));
      console.error(error);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!userDetails) return;

    resetVerificationState();

    try {
      const result = await sendOtp({ phoneNumber: userDetails.phoneNumber });

      if (result.status === 'SUCCESS') {
        if (result.data?.expiresAt) {
          const expiryDate = new Date(result.data.expiresAt);
          setOtpExpiresAt(expiryDate);
          // Initialize timer immediately
          const now = new Date().getTime();
          const remaining = Math.max(
            0,
            Math.floor((expiryDate.getTime() - now) / 1000)
          );
          setTimeRemaining(remaining);
        }
        // Start 60-second resend cooldown after resend
        setResendTimeRemaining(60);
        step2Form.reset({ code: '' });
        toast.success('Verification code sent successfully!');
      } else {
        if (result.data?.rateLimited) {
          setVerificationState(prev => ({
            ...prev,
            isRateLimited: true,
            error:
              result.message ||
              'Too many requests. Please wait before requesting another code.',
          }));
        } else {
          toast.error(result.message || 'Failed to resend verification code');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    }
  };

  if (currentStep === 'completed') {
    return (
      <Card className="w-full max-w-[420px]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Account Created!</CardTitle>
          <CardDescription>
            Your account has been successfully created and verified. Redirecting
            you now...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (currentStep === 'verification') {
    const { isSubmitting } = step2Form.formState;
    const isCodeExpired = timeRemaining === 0;
    const canSubmit =
      !isSubmitting && !isCodeExpired && verificationState.canRetry;
    // Updated resend logic: Enable after 60-second cooldown (much more user-friendly)
    const canResend = resendTimeRemaining === 0 && !!otpExpiresAt;

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Resend Debug:', {
        otpExpiresAt: !!otpExpiresAt,
        timeRemaining,
        resendTimeRemaining,
        canRetry: verificationState.canRetry,
        isRateLimited: verificationState.isRateLimited,
        canResend,
        finalDisabled: !canResend || verificationState.isRateLimited,
      });
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Verify Your Phone Number</CardTitle>
            <CardDescription>
              We&apos;ve sent a 6-digit verification code to{' '}
              <span className="font-medium">{userDetails?.phoneNumber}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Display */}
            {verificationState.error && (
              <Alert
                variant={
                  verificationState.isExpired ? 'default' : 'destructive'
                }
                className={cn(
                  'mb-4',
                  verificationState.isExpired &&
                    'border-orange-200 bg-orange-50 text-orange-800',
                  !verificationState.isExpired &&
                    'border-red-200 bg-red-50 text-gray-800 [&>svg]:text-red-500'
                )}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verificationState.error}</AlertDescription>
              </Alert>
            )}

            {/* Rate Limit Warning */}
            {verificationState.isRateLimited && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You reached the maximum number of requests. Please wait before
                  requesting another code.
                </AlertDescription>
              </Alert>
            )}

            <Form {...step2Form}>
              <form
                onSubmit={step2Form.handleSubmit(onStep2Submit)}
                className="space-y-4"
              >
                <FormField
                  control={step2Form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••"
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                          disabled={
                            isCodeExpired || !verificationState.canRetry
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Timer Display */}
                {timeRemaining > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Code expires in {formatTime(timeRemaining)}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={resendOtp}
                disabled={!canResend || verificationState.isRateLimited}
                className="text-sm"
              >
                {verificationState.isRateLimited
                  ? 'Rate limited - Cannot resend'
                  : 'Resend Code'}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setCurrentStep('details');
                  setUserDetails(null);
                  setOtpExpiresAt(null);
                  setResendTimeRemaining(0);
                  resetVerificationState();
                  // Reset step 2 form to clear verification code input
                  step2Form.reset({ code: '' });
                }}
                className="text-sm"
              >
                ← Back to sign up form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Details form (unchanged, keeping toast for errors as you mentioned)
  const { isSubmitting } = step1Form.formState;

  return (
    <div className="space-y-6">
      <Form {...step1Form}>
        <form
          onSubmit={step1Form.handleSubmit(onStep1Submit)}
          className="space-y-4"
        >
          <FormField
            control={step1Form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={step1Form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={step1Form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="09XX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={step1Form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={step1Form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </Form>

      <div className="flex items-center">
        <Separator className="flex-1" />
        <span className="px-3 text-sm text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Button variant="outline" className="w-full" asChild>
        <a href="/api/login/google" className="flex items-center gap-2">
          <GoogleIcon />
          Sign up with Google
        </a>
      </Button>
    </div>
  );
};

export { SignUpForm };
