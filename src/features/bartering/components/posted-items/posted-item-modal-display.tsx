/**
 * PostedItemModalDisplay Component
 * Displays posted items in modal contexts with full-width layout
 * No actions, no borders, designed for view-only in modals
 */

'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { PostedItemWithDetails } from '../../queries/posted-item.types';
import { getAvatarColor } from '@/utils/avatar-colors';
import { capitalizeFirstLetter } from '@/utils/text-utils';
import Link from 'next/link';
import { usersWallPath } from '@/paths';

interface PostedItemModalDisplayProps {
  postedItem: PostedItemWithDetails;
}

export const PostedItemModalDisplay = ({
  postedItem,
}: PostedItemModalDisplayProps) => {
  // Format the date for display
  const timeAgo = formatDistanceToNow(new Date(postedItem.createdAt), {
    addSuffix: true,
  });

  // Get user initials for avatar fallback
  const userInitials = postedItem.user.username
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className="w-full">
      {/* Post Header - Full width */}
      <div className="w-full px-4 py-3 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <Link href={usersWallPath(postedItem.user.id)}>
            <Avatar className="h-10 w-10">
              {postedItem.user.profile?.profilePictureSecureUrl && (
                <AvatarImage
                  src={postedItem.user.profile.profilePictureSecureUrl}
                  alt={`${postedItem.user.username}'s profile picture`}
                />
              )}
              <AvatarFallback
                className={`${getAvatarColor(
                  postedItem.user.id
                )}  text-sm font-medium`}
              >
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* User Info & Timestamp */}
          <div className="flex flex-col">
            <Link href={usersWallPath(postedItem.user.id)}>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {capitalizeFirstLetter(postedItem.user.username)}
              </span>
            </Link>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo}
              </span>
              {/* Status Badge */}
              <Badge variant="default" className="text-xs">
                {postedItem.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content - Full width */}
      <div className="w-full px-4 py-2 bg-white dark:bg-gray-900">
        {/* Post Title */}
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
          {postedItem.title}
        </h3>

        {/* Post Details */}
        <p className="whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
          {postedItem.details}
        </p>
      </div>

      {/* Post Image - Full width, no borders */}
      {postedItem.imageSecureUrl && (
        <div className="w-full">
          <Image
            src={postedItem.imageSecureUrl}
            alt={postedItem.title}
            width={800}
            height={600}
            className="w-full h-auto object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>
      )}
    </div>
  );
};
