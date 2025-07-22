'use server';

import { getAuth } from '@/features/auth/queries/get-auth';
import { getNotifications } from '../queries/get-notifications';

export const getNotificationsAction = async () => {
  try {
    // Get current auth to ensure user can only see their own notifications
    const auth = await getAuth();

    if (!auth.user) {
      return {
        error: 'You must be logged in to view notifications',
        notifications: null,
      };
    }

    const notifications = await getNotifications(auth.user.id);

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return {
      error: 'Failed to retrieve notifications',
      notifications: null,
    };
  }
};
