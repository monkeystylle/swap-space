import Link from 'next/link';
import { CardCompact } from '@/components/card-compact';
import { ChangePasswordForm } from '@/features/password/components/change-password-form';
import { homePath } from '@/paths';

const PasswordPage = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
      <CardCompact
        title="Change Password"
        description="Update your account password"
        className="w-full max-w-[420px] animate-fade-from-top"
        content={<ChangePasswordForm />}
        footer={
          <Link
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            href={homePath()}
          >
            Back to Home Page
          </Link>
        }
      />
    </div>
  );
};

export default PasswordPage;
