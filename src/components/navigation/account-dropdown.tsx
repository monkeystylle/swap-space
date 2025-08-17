import { User } from '@prisma/client';
import { LucideLock, LucideLogOut, LucideUser } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { accountPasswordPath, accountProfilePath } from '@/paths';
import { signOut } from '@/features/auth/actions/sign-out';
import { useProfile } from '@/features/profile/hooks/use-profile';

type AccountDropdownProps = {
  user: User;
};

const AccountDropdown = ({ user }: AccountDropdownProps) => {
  const isGoogleAuth = user.passwordHash === 'GOOGLE_OAUTH_USER';
  const { data: profile } = useProfile(user.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Avatar>
          {profile?.profilePictureSecureUrl && (
            <AvatarImage
              src={profile.profilePictureSecureUrl}
              alt={`${user.username}'s profile picture`}
            />
          )}
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={accountProfilePath()}>
            <LucideUser className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        {isGoogleAuth ? (
          <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
            <LucideLock className="mr-2 h-4 w-4" />
            <span>Password (Google Account)</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={accountPasswordPath()}>
              <LucideLock className="mr-2 h-4 w-4" />
              <span>Password</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOut}>
            <LucideLogOut className="mr-2 h-4 w-4" />
            <button type="submit">Sign Out</button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { AccountDropdown };
