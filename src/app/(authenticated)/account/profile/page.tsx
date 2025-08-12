import { getAuth } from '@/features/auth/queries/get-auth';
import { ProfileDisplay } from '@/features/profile/components/profile-display';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const auth = await getAuth();

  if (!auth.user) {
    redirect('/auth/login');
  }

  return (
    <div className="container-custom">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Manage your personal information and profile picture
          </p>
        </div>

        {/* Profile Display */}
        <ProfileDisplay userId={auth.user.id} isOwner={true} />
      </div>
    </div>
  );
}
