/**
 * Public Profile Page - View profile for any user
 * Shows profile information for the specified user
 */

import { getAuth } from '@/features/auth/queries/get-auth';
import { ProfileDisplay } from '@/features/profile/components/profile-display';
import { prisma } from '@/lib/prisma';
import { capitalizeFirstLetter } from '@/utils/text-utils';
import { notFound } from 'next/navigation';

type ProfilePageProps = {
  params: Promise<{
    userid: string;
  }>;
};

const ProfilePage = async ({ params }: ProfilePageProps) => {
  const { userid } = await params;
  const auth = await getAuth();

  // Fetch the profile owner's data
  const profileOwner = await prisma.user.findUnique({
    where: { id: userid },
    select: { username: true },
  });

  if (!profileOwner) {
    notFound();
  }

  // Check if the current user is the owner of this profile
  const isOwner = auth.user?.id === userid;

  const displayName = capitalizeFirstLetter(profileOwner.username);

  return (
    <div className="container-custom">
      <div className="max-w-4xl mx-auto py-4 sm:py-6">
        <div className="px-4 space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {isOwner ? 'My Profile' : `${displayName}'s Profile`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {isOwner
                ? 'Manage your personal information and profile picture'
                : ` ${displayName}'s profile information`}
            </p>
          </div>

          {/* Profile Display */}
          <div className="max-w-2xl mx-auto sm:mx-0">
            <ProfileDisplay userId={userid} isOwner={isOwner} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
