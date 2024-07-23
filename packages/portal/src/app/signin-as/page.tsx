'use client';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useSignInMethod } from '@/contexts/SignInMethodContext';
import useSignIn from '@/hooks/useSignIn';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUser from '@/hooks/useUser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type SignInMethod = 'google' | 'farcaster' | 'twitter';

const SignInAs = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const signInMethod = searchParams.get('signInMethod') as SignInMethod;
  const { data: user } = useUser(userId);
  const { setSignInMethod } = useSignInMethod();
  const { mutateAsync: signIn } = useSignIn();
  const { data: signedInUser } = useSignedInUser();
  const router = useRouter();

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    // Redirect to home if user is already signed in
    if (signedInUser) {
      router.push('/');
    }
  }, [signedInUser, router]);

  useEffect(() => {
    if (signInMethod) {
      setSignInMethod(signInMethod);
    }
  }, [setSignInMethod, signInMethod]);

  useEffect(() => {
    setOptions({
      title: 'Add rep',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  if (!userId || !signInMethod) {
    return <div>Missing userId or signInMethod</div>;
  }

  if (!user) {
    return <></>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[62%]">
      <AvatarWithFallback
        imageUrl={user.pfpUrl || null}
        name={user.displayName || ''}
        size={64}
        alt="User avatar"
      ></AvatarWithFallback>
      <div className="flex flex-col text-center mt-2">
        <div className="font-bold">{user.displayName}</div>
        <div className="opacity-80 mt-4">Sign in to add rep</div>
      </div>
      <Button
        className="mt-4"
        onClick={() => {
          signIn();
        }}
      >
        Sign in
      </Button>
    </div>
  );
};

export default SignInAs;
