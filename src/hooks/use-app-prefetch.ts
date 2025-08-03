import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useMessagingPrefetch } from '@/features/messaging/hooks/use-messaging-prefetch';
import { messagesPath, disclaimerPath, usersWallPath, homePath } from '@/paths';

export const useAppPrefetch = () => {
  const router = useRouter();
  const { user, isFetched } = useAuth();
  const { prefetchConversations } = useMessagingPrefetch({ userId: user?.id });

  useEffect(() => {
    if (!isFetched) return;

    // Prefetch critical routes for authenticated users
    if (user) {
      const criticalRoutes = [
        messagesPath(),
        usersWallPath(user.id),
        disclaimerPath(),
        homePath(),
      ];

      // Prefetch these routes with a small delay to avoid blocking initial render
      const timer = setTimeout(() => {
        criticalRoutes.forEach(route => {
          router.prefetch(route);
        });

        // Also prefetch conversations data in the background
        prefetchConversations().catch(error => {
          console.log(
            'Background prefetch of conversations failed (this is expected if user has no conversations):',
            error
          );
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, isFetched, router, prefetchConversations]);
};
