/**
 * Wall Page - User-specific bartering feed
 * Shows posted items for a specific user
 */

import { CreatePostTrigger } from '@/features/bartering/components/posted-items/create-post-trigger';
import { PostedItemsList } from '@/features/bartering/components/posted-items/posted-item-list';

type WallPageProps = {
  params: Promise<{
    userid: string;
  }>;
};

const WallPage = async ({ params }: WallPageProps) => {
  const { userid } = await params;

  return (
    <div className="min-h-screen " style={{ border: '1px solid pink' }}>
      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            User Wall
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            View items posted by this user
          </p>
        </div>

        {/* Create Post Section */}
        <div className="mb-6">
          <CreatePostTrigger />
        </div>

        {/* Feed Section */}
        <div className="space-y-1">
          <PostedItemsList userId={userid} />
        </div>
      </div>
    </div>
  );
};

export default WallPage;
