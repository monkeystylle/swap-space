'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNotifications } from '../hooks/use-notifications';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications-count';
import { markNotificationAsRead } from '../actions/mark-notification-read';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  userId?: string;
}

export const NotificationDropdown = ({ userId }: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [], refetch: refetchNotifications } =
    useNotifications(userId);
  const { data: unreadCount = 0, refetch: refetchUnreadCount } =
    useUnreadNotificationsCount(userId);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleNotificationClick = async (notificationId: string) => {
    // Mark notification as read
    try {
      await markNotificationAsRead(notificationId);
      // Refetch to update the UI
      refetchNotifications();
      refetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    // Close the dropdown
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Tooltip delayDuration={700}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer relative h-12 w-12 rounded-full bg-muted/50 hover:bg-muted"
              >
                <Bell className="!h-5 !w-5" />

                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 max-h-96 overflow-y-auto"
        align="end"
      >
        <DropdownMenuLabel className="font-semibold text-lg">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {unreadNotifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No new notifications
          </div>
        ) : (
          unreadNotifications.slice(0, 10).map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className="p-0 focus:bg-accent"
            >
              {notification.postedItemId ? (
                <Link
                  href={`/item/${notification.postedItemId}`}
                  className="w-full p-3 block hover:bg-accent/50"
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </Link>
              ) : (
                <div
                  className="w-full p-3 cursor-pointer hover:bg-accent/50"
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}

        {unreadNotifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center text-sm text-muted-foreground">
              And {unreadNotifications.length - 10} more...
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
