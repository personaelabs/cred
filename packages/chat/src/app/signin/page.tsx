'use client';
import '@farcaster/auth-kit/styles.css';
import { SignInButton } from '@farcaster/auth-kit';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSignIn from '@/hooks/useSignIn';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { Loader2 } from 'lucide-react';
import theme from '@/lib/theme';
import useSignedInUser from '@/hooks/useSignedInUser';

const SignIn = () => {
  const router = useRouter();
  const {
    mutateAsync: signIn,
    isPending: isSigningIn,
    isSuccess: signInComplete,
  } = useSignIn();
  const { setOptions } = useHeaderOptions();
  const { data: signedInUser } = useSignedInUser();

  useEffect(() => {
    setOptions({
      title: 'Sign In',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  useEffect(() => {
    if (signedInUser) {
      router.replace('/rooms');
    }
  }, [signedInUser, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      {isSigningIn || signInComplete ? (
        <div className="flex flex-row items-center">
          <Loader2
            className="mr-2 animate-spin"
            size={16}
            color={theme.orange}
          ></Loader2>
          <div>Signing in</div>
        </div>
      ) : (
        <SignInButton
          onSuccess={async statusApiResponse => {
            await signIn(statusApiResponse);
            router.replace('/');
          }}
        />
      )}
    </div>
  );
};

export default SignIn;
