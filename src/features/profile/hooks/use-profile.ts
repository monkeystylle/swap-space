/**
 * React Query hook for getting profile data
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfileAction } from '../actions/get-profile';

/**
 * Hook to get profile data for a user
 */
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfileAction(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
