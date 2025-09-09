'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

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
import { signIn } from '../actions/sign-in';
import { homePath } from '@/paths';
import { GoogleIcon } from '@/components/ui/google-icon';
import { Separator } from '@/components/ui/separator';
// import { Separator } from '@/components/ui/separator';
// import { GoogleIcon } from '@/components/ui/google-icon';

const clientSignInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(191, 'Email must be less than 191 characters')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(191, 'Password must be less than 191 characters'),
});

type FormValues = z.infer<typeof clientSignInSchema>;

const SignInForm = () => {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await signIn(values);

      if (result.status === 'SUCCESS') {
        toast.success(result.message || 'Signed in successfully');
        router.push(homePath());
      } else {
        toast.error(result.message || 'Failed to sign in');

        // Handle field-specific errors from the server
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof FormValues, {
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

  return (
    <div className="space-y-6">
      {/* Existing Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
            control={form.control}
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>

      {/* Separator */}
      <div className="flex items-center">
        <Separator className="flex-1" />
        <span className="px-3 text-sm text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Google Sign In Button */}
      <Button variant="outline" className="w-full" asChild>
        <a href="/api/login/google" className="flex items-center gap-2">
          <GoogleIcon />
          Sign in with Google
        </a>
      </Button>
    </div>
  );
};

export { SignInForm };
