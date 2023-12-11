import { useAccount, useSignMessage, useSignTypedData } from 'wagmi';
import { Separator } from '@/components/ui/separator';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { useSignedInAddress } from '@/hooks/useSignedInAddress';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useVerifiedAddresses } from '@/hooks/useVerifiedAddresses';
import { createVerificationMessage, saveVerifiedAddress, trimAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { Check, Plus } from 'lucide-react';

export default function Addresses() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signTypedDataAsync } = useSignTypedData();
  const { toast } = useToast();
  const { verifiedAddresses, setVerifiedAddresses } = useVerifiedAddresses();
  const [newAddressConnected, setNewAddressConnected] = useState(false);
  const { signedInAddress } = useSignedInAddress();

  useEffect(() => {
    if (verifiedAddresses !== null) {
      if (!newAddressConnected && address && !verifiedAddresses.includes(address)) {
        setNewAddressConnected(true);
      }
    }
  }, [address, newAddressConnected, verifiedAddresses]);

  return (
    <div className="mt-8">
      <div className="flex justify-center">
        <h2 className="text-2xl font-bold">My addresses</h2>
      </div>
      <div className="mt-8">
        <p className="font-semibold">Account address</p>
        <p className="mt-4">{signedInAddress}</p>
        <Separator />
      </div>
      <div className="mt-8">
        <p className="font-semibold">Verified addresses</p>
        {verifiedAddresses?.map((address, i) => {
          return (
            <div key={i} className="mt-4">
              <div>{address}</div>
              <Separator />
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <Button
          disabled={newAddressConnected}
          onClick={() => {
            if (openConnectModal) {
              openConnectModal();
            } else {
              toast({
                title: `Please disconnect ${trimAddress(address as Hex)} first`,
              });
            }
          }}
        >
          {!newAddressConnected ? (
            <Plus className="mr-2 h-4 w-4"></Plus>
          ) : (
            <Check className="mr-2 h-4 w-4"></Check>
          )}
          Connect another address
        </Button>
        {address && newAddressConnected ? (
          <Button
            disabled={!newAddressConnected}
            onClick={async () => {
              // @ts-ignore
              const sig = await signTypedDataAsync(createVerificationMessage(address as Hex));
              // TODO: Verify signature?

              saveVerifiedAddress(address as Hex, sig);

              // We need to update the verified addresses list
              // here because `saveVerifiedAddress` only stores the address
              // in local storage.
              setVerifiedAddresses((prev) => [...(prev || []), address as Hex]);

              toast({
                title: `Address ${trimAddress(address as Hex)} verified`,
              });

              setNewAddressConnected(false);
            }}
          >
            Verify {trimAddress(address as Hex)}
          </Button>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
