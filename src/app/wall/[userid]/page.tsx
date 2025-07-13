/**
 * Wall Page - User-specific bartering feed
 * Shows posted items for a specific user
 */

import { getAuth } from '@/features/auth/queries/get-auth';
import { CreatePostTrigger } from '@/features/bartering/components/posted-items/create-post-trigger';
import { PostedItemsList } from '@/features/bartering/components/posted-items/posted-item-list';
import { prisma } from '@/lib/prisma';
import { capitalizeFirstLetter } from '@/utils/text-utils';

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
    <div className="min-h-screen " style={{ border: '1px solid pink' }}>
      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {displayName} Wall
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            View items posted by this user
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
