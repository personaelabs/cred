'use client';
import { useRouter } from 'next/navigation';
import { SignInButton } from '@farcaster/auth-kit';
import { useEffect, useLayoutEffect } from 'react';
import { Loader2 } from 'lucide-react';
import useSignedInUser from '@/hooks/useSignedInUser';
import useSignIn from '@/hooks/useSignIn';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();

  const { data: user, status, error: signedInUserError } = useSignedInUser();
  const { mutate } = useSignIn();

  const userFound = status === 'success' && user !== null;

  useLayoutEffect(() => {
    // If we got a user, either from login or however it was pulled up from local storage,
    // then we're logged in and we can move on to the account page.
    if (userFound) {
      console.log('User is logged in');
      router.push('/account');
    }
  }, [router, userFound]);

  useEffect(() => {
    if (signedInUserError) {
      toast.error('Failed to get signed-in user');
    }
  }, [signedInUserError]);

  return (
    <div className="flex flex-col justify-start items-center h-[90vh] gap-10">
      <h2 className="text-3xl font-bold mb-2">Welcome</h2>
      <div>
        {!userFound ? (
          <SignInButton onSuccess={mutate} />
        ) : (
          <Loader2 className="animate-spin"></Loader2>
        )}
      </div>
    </div>
  );
}
