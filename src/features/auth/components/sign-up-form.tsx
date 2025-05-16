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
import { signUp } from '../actions/sign-up';
import { homePath } from '@/paths';
import { Separator } from '@/components/ui/separator';

const clientSignUpSchema = z
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

type FormValues = z.infer<typeof clientSignUpSchema>;

const SignUpForm = () => {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSignUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await signUp(values);

      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        router.push(homePath());
      } else {
        toast.error(result.message || 'Failed to create account');

        // If the server returns field-specific validation errors (e.g. from Zod),
        // loop through each error and set it on the corresponding form field.
        // This ensures that server-side validation errors are displayed under
        // the correct input fields in the UI, just like client-side errors.
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              // Manually set the error for this field in React Hook Form,
              // so <FormMessage /> will display the error message under the input.
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
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
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
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
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
        <a href="/api/login/google">Sign up with Google</a>
      </Button>
    </div>
  );
};

export { SignUpForm };
