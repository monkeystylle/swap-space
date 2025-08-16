/**
 * Wall Page - User-specific bartering feed
 * Shows posted items for a specific user
 */

import { getAuth } from '@/features/auth/queries/get-auth';
import { CreatePostTrigger } from '@/features/bartering/components/posted-items/create-post-trigger';
import { PostedItemsList } from '@/features/bartering/components/posted-items/posted-item-list';
import { MessageUserButton } from '@/features/messaging/components/message-user-button';
import { prisma } from '@/lib/prisma';
import { capitalizeFirstLetter } from '@/utils/text-utils';
import Link from 'next/link';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WallPageProps = {
  params: Promise<{
    userid: string;
  }>;
};

const WallPage = async ({ params }: WallPageProps) => {
  const { userid } = await params;
  const auth = await getAuth();

  // Fetch the wall owner's data
  const wallOwner = await prisma.user.findUnique({
    where: { id: userid },
    select: { username: true },
  });

  // Check if the current user is the owner of this wall
  const isOwner = auth.user?.id === userid;

  const displayName = capitalizeFirstLetter(wallOwner?.username);

  return (
    <div className="container-custom">
      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {displayName} Wall
            </h1>
            <div className="flex items-center gap-2">
              {/* Profile Button - show for all authenticated users */}
              {auth.user && wallOwner && (
                <Link
                  href={isOwner ? '/account/profile' : `/profile/${userid}`}
                >
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {isOwner ? 'My Profile' : 'View Profile'}
                  </Button>
                </Link>
              )}
              {/* Message Button - only show for authenticated users viewing other users' walls */}
              {auth.user && !isOwner && wallOwner && (
                <MessageUserButton
                  userId={userid}
                  username={wallOwner.username}
                />
              )}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {isOwner
              ? 'View your posted items'
              : 'View items posted by this user'}
          </p>
        </div>

        {/* Create Post Section */}
        {isOwner && (
          <div className="mb-6">
            <CreatePostTrigger />
          </div>
        )}

        {/* Feed Section */}
        <div className="space-y-1">
          <PostedItemsList userId={userid} />
        </div>
      </div>
    </div>
  );
};

export default WallPage;
