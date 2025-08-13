/**
 * React Query hook for updating profile picture with optimistic updates
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProfilePicture } from '../actions/update-profile-picture';
import type { Profile } from '../queries/profile.types';

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
