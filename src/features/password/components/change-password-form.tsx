'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
import { PasswordInput } from '@/components/password-input';
import { changePassword } from '../actions/change-password';
import { useAuth } from '@/features/auth/hooks/use-auth';

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

type FormValues = z.infer<typeof changePasswordSchema>;

const ChangePasswordForm = () => {
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { isSubmitting } = form.formState;

  // Check if user is Google OAuth user
  const isGoogleAuth = user?.passwordHash === 'GOOGLE_OAUTH_USER';

  if (isGoogleAuth) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          You signed in with Google. Password changes are not available for
          Google accounts. To change your password, please manage it through
          your Google account settings.
        </p>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await changePassword(values);

      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        form.reset(); // Clear the form on success
      } else {
        toast.error(result.message || 'Failed to change password');

        // Handle field-specific validation errors
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="oldPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••" {...field} />
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
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Changing Password...' : 'Change Password'}
        </Button>
      </form>
    </Form>
  );
};

export { ChangePasswordForm };
