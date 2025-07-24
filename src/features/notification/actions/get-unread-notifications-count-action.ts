'use server';

import { getAuth } from '@/features/auth/queries/get-auth';
import { getUnreadNotificationsCount } from '../queries/get-unread-notifications-count';

export const getUnreadNotificationsCountAction = async () => {
  try {
    // Get current auth to ensure user can only see their own notification count
    const auth = await getAuth();

    if (!auth.user) {
      return {
        error: 'You must be logged in to view notification count',
        count: 0,
      };
    }

    const count = await getUnreadNotificationsCount(auth.user.id);

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    return {
      error: 'Failed to retrieve notification count',
      count: 0,
    };
  }
};
