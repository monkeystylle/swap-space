'use client';

import { LucideKanban, Home, User, Info, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useUnreadCount } from '@/features/messaging/hooks/use-unread-count';
import { NotificationDropdown } from '@/features/notification/components/notification-dropdown';
import {
  homePath,
  signInPath,
  signUpPath,
  usersWallPath,
  disclaimerPath,
  messagesPath,
} from '@/paths';
import { AccountDropdown } from './account-dropdown';

const Navbar = () => {
  const { user, isFetched } = useAuth();
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadCount(user?.id);

  if (!isFetched) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const navItems = user ? (
    <AccountDropdown user={user} />
  ) : (
    <>
      <Link
        href={signUpPath()}
        className={buttonVariants({ variant: 'outline' })}
      >
        Sign Up
      </Link>
      <Link
        href={signInPath()}
        className={buttonVariants({ variant: 'default' })}
      >
        Sign In
      </Link>
    </>
  );

  return (
    <nav
      className="
        animate-header-from-top
        supports-backdrop-blur:bg-background/60
        fixed left-0 right-0 top-0 z-20
        border-b bg-background/95 backdrop-blur
        w-full flex py-2.5 px-5 justify-between items-center
        
      "
    >
      {/* Left side - Logo */}
      <div className="flex gap-x-2">
        <Link
          href={homePath()}
          className={buttonVariants({ variant: 'ghost' })}
        >
          <LucideKanban />
          <h1 className="text-lg font-semibold">Swap Space</h1>
        </Link>
      </div>

      {/* Middle - Navigation Icons (only show when logged in) */}
      {user && (
        <div className="flex gap-x-8">
          <Tooltip delayDuration={700}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative h-12 w-12 rounded-xl ${
                  isActive(homePath())
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                asChild
              >
                <Link href={homePath()}>
                  <Home className="!h-7 !w-7" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Home</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={700}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative h-12 w-12 rounded-xl ${
                  isActive(usersWallPath(user.id))
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                asChild
              >
                <Link href={usersWallPath(user.id)}>
                  <User className="!h-7 !w-7" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>My Wall</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={700}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative h-12 w-12 rounded-xl ${
                  isActive(messagesPath())
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                asChild
              >
                <Link href={messagesPath()}>
                  <Mail className="!h-7 !w-7" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full"></span>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Messages</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={700}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative h-12 w-12 rounded-xl ${
                  isActive(disclaimerPath())
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                asChild
              >
                <Link href={disclaimerPath()}>
                  <Info className="!h-7 !w-7" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disclaimer</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Right side - Theme switcher, notifications, messages, and auth */}
      <div className="flex gap-x-2 items-center">
        <ThemeSwitcher />

        {/* Notification icon (only show when logged in) */}
        {user && (
          <>
            <NotificationDropdown userId={user.id} />
          </>
        )}

        {navItems}
      </div>
    </nav>
  );
};

export { Navbar };
