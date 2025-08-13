/**
 * React Query hook for updating profile with optimistic updates
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProfile } from '../actions/update-profile';
import type { UpdateProfileData, Profile } from '../queries/profile.types';

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
