'use client';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function Home() {
  const router = useRouter();
  const { isConnected, isConnecting } = useAccount();

  // If the wallet is not connected, redirect to onboarding
  if (isConnecting === false && isConnected === false) {
    router.push('/onboarding');
  }

  return (
    <>
      <div className="flex justify-center items-center">
      </div>
    </>
  );
}
