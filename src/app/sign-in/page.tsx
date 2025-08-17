import Link from 'next/link';
import { CardCompact } from '@/components/card-compact';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { signUpPath } from '@/paths';

const SignInPage = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
      <CardCompact
        title="Sign In"
        description="Sign in to your account"
        className="w-full max-w-[420px] animate-fade-from-top"
        content={<SignInForm />}
        footer={
          <>
            <Link
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              href={signUpPath()}
            >
              No account yet?
            </Link>

            {/* <Link
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              href={passwordForgotPath()}
            >
              Forgot Password?
            </Link> */}
          </>
        }
      />
    </div>
  );
};

export default SignInPage;
