'use client';
import { useRouter } from 'next/navigation';
import { SignInButton } from '@farcaster/auth-kit';
import { useUser } from '@/context/UserContext';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const { user, loginWithFarcaster } = useUser();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Are we already logged in load, from local storage?
  useEffect(() => {
    // If we got a user, either from login or however it was pulled up from local storage,
    // then we're logged in and we can move on to the account page.
    if (user) {
      console.log('User is logged in');
      router.push('/account');
    }
  }, [router, user]);

  return (
    <div className="flex flex-col justify-start items-center h-[90vh] gap-10">
      <h2 className="text-3xl font-bold mb-2">Welcome</h2>
      <div>
        {!isLoggedIn ? (
          <SignInButton
            onSuccess={data => {
              if (isLoggedIn) {
                return;
              }
              setIsLoggedIn(true);

              loginWithFarcaster(data);
            }}
          />
        ) : (
          <Loader2 className="animate-spin"></Loader2>
        )}
      </div>
    </div>
  );
}
