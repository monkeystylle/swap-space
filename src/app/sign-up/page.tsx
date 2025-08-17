import Link from 'next/link';
import { CardCompact } from '@/components/card-compact';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { signInPath } from '@/paths';

const SignUpPage = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
      <CardCompact
        title="Sign Up"
        description="Create an account to get started"
        className="w-full max-w-[420px] animate-fade-from-top"
        content={<SignUpForm />}
        footer={
          <Link
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            href={signInPath()}
          >
            Have an account? Sign In now.
          </Link>
        }
      />
    </div>
  );
};

export default SignUpPage;
