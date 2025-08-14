/**
 * React Query hook for updating profile picture
 *
 * Note: No optimistic updates since Cloudinary transformation with gravity
 * needs to be applied first before we can get the final image URL
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProfilePicture } from '../actions/update-profile-picture';

/**
 * Hook to update profile picture
 * Waits for Cloudinary upload and transformation before updating cache
 */
export const useUpdateProfilePicture = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfilePicture,
    onError: error => {
      console.error('Failed to update profile picture:', error);
      toast.error('Failed to update profile picture. Please try again.');
    },
    onSuccess: result => {
      if (result.status === 'SUCCESS') {
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Failed to update profile picture');
      }
    },
    onSettled: () => {
      // Refetch profile data after mutation to get the updated image URL from Cloudinary
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      // Also invalidate any related profile queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
