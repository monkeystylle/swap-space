/**
 * React Query hook for creating profile
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createProfile } from '../actions/create-profile';

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
