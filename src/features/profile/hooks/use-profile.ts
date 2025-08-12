/**
 * React Query hook for profile management
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getProfile } from '../queries/get-profile';
import { createProfile } from '../actions/create-profile';
import { updateProfile } from '../actions/update-profile';
import { updateProfilePicture } from '../actions/update-profile-picture';
import type { UpdateProfileData, Profile } from '../queries/profile.types';

/**
 * Hook to get profile data for a user
 */
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new profile
 */
export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProfile,
    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);
        // Invalidate profile query to refetch
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else {
        toast.error(result.message || 'Failed to create profile');
      }
    },
    onError: error => {
      console.error('Failed to create profile:', error);
      toast.error('Something went wrong. Please try again.');
    },
  });
};

/**
 * Hook to update profile with optimistic updates
 */
export const useUpdateProfile = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (newData: UpdateProfileData) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['profile', userId] });

      // Get the current data from cache
      const previousProfile = queryClient.getQueryData<Profile>([
        'profile',
        userId,
      ]);

      // Optimistically update the cache
      if (previousProfile) {
        const optimisticProfile = {
          ...previousProfile,
          ...newData,
          updatedAt: new Date(),
        };

        queryClient.setQueryData(['profile', userId], optimisticProfile);
      }

      // Return context with previous data for rollback
      return { previousProfile };
    },
    onError: (error, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', userId], context.previousProfile);
      }
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    },
    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    },
    onSettled: () => {
      // Always refetch after mutation to ensure we have correct data
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
};

/**
 * Hook to update profile picture with optimistic updates
 */
export const useUpdateProfilePicture = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfilePicture,
    onMutate: async (imageFile: File) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['profile', userId] });

      // Get the current data from cache
      const previousProfile = queryClient.getQueryData<Profile>([
        'profile',
        userId,
      ]);

      // Create optimistic preview URL
      const previewUrl = URL.createObjectURL(imageFile);

      // Optimistically update the cache
      if (previousProfile) {
        const optimisticProfile = {
          ...previousProfile,
          profilePictureSecureUrl: previewUrl, // Use preview URL temporarily
          updatedAt: new Date(),
        };

        queryClient.setQueryData(['profile', userId], optimisticProfile);
      }

      // Return context with previous data for rollback
      return { previousProfile, previewUrl };
    },
    onError: (error, variables, context) => {
      // Cleanup preview URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }

      // Rollback to previous data on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', userId], context.previousProfile);
      }

      console.error('Failed to update profile picture:', error);
      toast.error('Failed to update profile picture. Please try again.');
    },
    onSuccess: (result, variables, context) => {
      // Cleanup preview URL since we now have the real URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }

      if (result.status === 'SUCCESS') {
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Failed to update profile picture');
      }
    },
    onSettled: () => {
      // Always refetch after mutation to ensure we have correct data
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
};
