'use client';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useSignInMethod } from '@/contexts/SignInMethodContext';
import useSignIn from '@/hooks/useSignIn';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUser from '@/hooks/useUser';
import { SignInMethod } from '@/types';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Suspense } from 'react';

const SignInAs = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const signInMethod = searchParams.get('signInMethod') as SignInMethod;
  const { data: user } = useUser(userId);
  const { setSignInMethod } = useSignInMethod();
  const {
    mutateAsync: signIn,
    isSigningIn,
    isSuccess: isSignSuccess,
  } = useSignIn({
    redirectToAddRep: true,
  });
  const { data: signedInUser } = useSignedInUser();
  const router = useRouter();

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    // Redirect to home if user is already signed in
    if (signedInUser && !isSignSuccess) {
      router.push('/');
    }
  }, [signedInUser, router, isSignSuccess]);

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
        disabled={isSigningIn}
        className="mt-4"
        onClick={async () => {
          await signIn();
        }}
      >
        {isSigningIn && (
          <Loader2 className="mr-2 w-4 h-4 animate-spin"></Loader2>
        )}
        Sign in
      </Button>
    </div>
  );
};

const WithSuspense = () => {
  return (
    <Suspense>
      <SignInAs />
    </Suspense>
  );
};

export default WithSuspense;
