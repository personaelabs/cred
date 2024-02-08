'use client';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { SignInButton, useSignInMessage } from '@farcaster/auth-kit';
import { useUser } from '@/context/UserContext';
// import useState
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { isConnected, isConnecting } = useAccount();

  const { user, loginWithFarcaster } = useUser();

  const [isLoggedIn, setIsLoggedIn] = useState(false);


  return (
    <div className="flex flex-col justify-center items-center h-[80vh] gap-10">

      <h2
        className="text-3xl font-bold mb-2"
      >Welcome
      </h2>
      {!isLoggedIn && (
      <SignInButton
        onSuccess={(data) => {
          if(isLoggedIn){
            return
          }
          console.log("success", data)
          loginWithFarcaster({
            fid: data.fid,
            displayName: data.username || "anon",
            pfpUrl: data.pfpUrl,
            custody: data.custody as `0x${string}`
          })
          router.push('/account')
          setIsLoggedIn(true)
        }}
      />
      )}

    </div>
  );
}
