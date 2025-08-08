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
import { Clock, Shield, CheckCircle } from 'lucide-react';

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
          'Please enter a valid Philippine mobile number (e.g., 09123456789)',
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

const SignUpForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SignUpStep>('details');
  const [userDetails, setUserDetails] = useState<Step1FormValues | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

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

        if (remaining === 0) {
          toast.error(
            'Verification code has expired. Please request a new one.'
          );
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpExpiresAt, currentStep]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Handle form submission and send OTP
  const onStep1Submit = async (values: Step1FormValues) => {
    try {
      const result = await sendOtp({ phoneNumber: values.phoneNumber });

      if (result.status === 'SUCCESS') {
        setUserDetails(values);
        setCurrentStep('verification');
        if (result.data?.expiresAt) {
          setOtpExpiresAt(new Date(result.data.expiresAt));
        }
        toast.success(result.message);
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

    try {
      // First verify the OTP
      const verifyResult = await verifyOtp({
        phoneNumber: userDetails.phoneNumber,
        code: values.code,
      });

      if (verifyResult.status !== 'SUCCESS') {
        toast.error(verifyResult.message || 'Invalid verification code');

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
      toast.error('An unexpected error occurred');
      console.error(error);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!userDetails) return;

    try {
      const result = await sendOtp({ phoneNumber: userDetails.phoneNumber });

      if (result.status === 'SUCCESS') {
        if (result.data?.expiresAt) {
          setOtpExpiresAt(new Date(result.data.expiresAt));
        }
        step2Form.reset({ code: '' });
        toast.success('New verification code sent!');
      } else {
        toast.error(result.message || 'Failed to resend verification code');
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
                          placeholder="123456"
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {timeRemaining > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Code expires in {formatTime(timeRemaining)}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || timeRemaining === 0}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={resendOtp}
                disabled={timeRemaining > 240} // Allow resend only in last 4 minutes or if expired
                className="text-sm"
              >
                Didn&apos;t receive the code? Resend
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setCurrentStep('details');
                  setUserDetails(null);
                  setOtpExpiresAt(null);
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

  // Step 1: Details form
  const { isSubmitting } = step1Form.formState;

  return (
    <div className="space-y-6">
      {/* Step 1 Form */}
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
                  <Input placeholder="09123456789" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Enter your Philippine mobile number for SMS verification
                </p>
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
                  <Input type="password" placeholder="••••••" {...field} />
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
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? 'Sending verification code...'
              : 'Send Verification Code'}
          </Button>
        </form>
      </Form>

      {/* Separator */}
      <div className="flex items-center">
        <Separator className="flex-1" />
        <span className="px-3 text-sm text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Google Sign Up Button */}
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
