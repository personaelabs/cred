import { Button } from '@/components/ui/button';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { saveVerifiedAddress, trimAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { useEffect, useState } from 'react';
import { useVerifiedAddresses } from '@/hooks/useVerifiedAddresses';
import { useRouter } from 'next/router';

const VerifyAddressPage = () => {
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const { verifiedAddresses } = useVerifiedAddresses();
  const [newAddressConnected, setNewAddressConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (verifiedAddresses !== null) {
      if (!newAddressConnected && address && !verifiedAddresses.includes(address)) {
        setNewAddressConnected(true);
      }
    }
  }, [address, newAddressConnected, verifiedAddresses]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center">
        <h2 className="text-2xl font-bold">Verify address</h2>
      </div>
      <Button
        onClick={() => {
          if (openConnectModal) {
            openConnectModal();
          } else {
            toast({
              title: `Please disconnect account ${trimAddress(address as Hex)} first`,
            });
          }
        }}
      >
        Connect wallet
      </Button>
      <Button
        disabled={!newAddressConnected}
        onClick={async () => {
          const sig = await signMessageAsync({
            message: 'Verify address',
          });
          // TODO: Verify signature?

          saveVerifiedAddress(address as Hex, sig);

          toast({
            title: `Address ${trimAddress(address as Hex)} verified`,
          });

          router.push('/addresses');
        }}
      >
        Sign message
      </Button>
    </div>
  );
};

export default VerifyAddressPage;
