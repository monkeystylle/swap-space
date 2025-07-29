import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { messagesPath, disclaimerPath, usersWallPath, homePath } from '@/paths';

export const useAppPrefetch = () => {
  const router = useRouter();
  const { user, isFetched } = useAuth();

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
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, isFetched, router]);
};
