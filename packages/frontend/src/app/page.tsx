'use client';
import { useRouter } from 'next/navigation';
import { useUserAccount } from '@/contexts/UserAccountContext';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isConnected, isConnecting } = useAccount();

  // If the wallet is not connected, redirect to onboarding
  if (isConnecting === false && isConnected === false) {
    router.push('/onboarding');
  }

  const { attestations } = useUserAccount();

  // Redirect to /verify if the user has no zero-knowledge attestations
  // (i.e. hasn't proven their eligibility)
  if (attestations && attestations.length === 0) {
    router.push('/groups/dev/verify');
  }

  const isLoading = isConnecting || attestations === null;

  return (
    <>
      <div className="flex justify-center items-center">
        {isLoading ? (
          <Loader2 className="animate-spin w-4 h-4"></Loader2>
        ) : (
          <div>Tweet writer comes here</div>
        )}
      </div>
    </>
  );
}
