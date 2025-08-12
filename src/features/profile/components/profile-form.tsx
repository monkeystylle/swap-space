/**
 * Profile Form Component
 * Handles creating and updating profile information (name and address)
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useCreateProfile, useUpdateProfile } from '../hooks/use-profile';
import type { Profile } from '../queries/profile.types';

// Form validation schema
const profileFormSchema = z.object({
  surname: z
    .string()
    .min(1, 'Surname is required')
    .max(100, 'Surname must be less than 100 characters'),
  givenName: z
    .string()
    .min(1, 'Given name is required')
    .max(100, 'Given name must be less than 100 characters'),
  middleInitial: z
    .string()
    .max(5, 'Middle initial must be less than 5 characters')
    .optional()
    .or(z.literal('')),
  street: z
    .string()
    .min(1, 'Street address is required')
    .max(200, 'Street must be less than 200 characters'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  province: z
    .string()
    .min(1, 'Province is required')
    .max(100, 'Province must be less than 100 characters'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code must be less than 20 characters'),
  country: z
    .string()
    .max(100, 'Country must be less than 100 characters')
    .optional(),
});

// Type for form values
type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Props interface
interface ProfileFormProps {
  userId: string;
  profile: Profile | null;
  onSuccess?: () => void; // Called when profile is saved successfully
  onCancel?: () => void; // Called when user cancels editing
  isEditing?: boolean; // Whether this is an edit form or create form
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  userId,
  profile,
  onSuccess,
  onCancel,
  isEditing = false,
}) => {
  // Mutations
  const createProfileMutation = useCreateProfile();
  const updateProfileMutation = useUpdateProfile(userId);

  // Form management with validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      surname: profile?.surname || '',
      givenName: profile?.givenName || '',
      middleInitial: profile?.middleInitial || '',
      street: profile?.street || '',
      city: profile?.city || '',
      province: profile?.province || '',
      postalCode: profile?.postalCode || '',
      country: profile?.country || 'Philippines',
    },
  });

  // Form submission
  const onSubmit = async (values: ProfileFormValues) => {
    try {
      let result;

      if (profile && isEditing) {
        // Update existing profile
        result = await updateProfileMutation.mutateAsync(values);
      } else {
        // Create new profile
        result = await createProfileMutation.mutateAsync(values);
      }

      if (result.status === 'SUCCESS') {
        onSuccess?.();
      }
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Profile form submission error:', error);
    }
  };

  // Check if form can be submitted
  const isSubmitting =
    createProfileMutation.isPending || updateProfileMutation.isPending;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Personal Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Given Name */}
              <FormField
                control={form.control}
                name="givenName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Given Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your given name"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Surname */}
              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surname *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your surname"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Middle Initial */}
            <FormField
              control={form.control}
              name="middleInitial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Initial</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="M.I."
                      maxLength={5}
                      className="max-w-24"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Address Information
            </h4>

            {/* Street Address */}
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your street address"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your city"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Province */}
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your province"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Postal Code */}
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter postal code"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Philippines"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className={onCancel ? 'flex-1' : 'w-full'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Profile' : 'Save Profile'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
