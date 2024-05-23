'use client';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useEligibleCreddd from '@/hooks/useEligibleCreddd';
import useSignedInUser from '@/hooks/useSignedInUser';
import useSubmitAddress from '@/hooks/useSubmitAddress';
import useUser from '@/hooks/useUser';
import { constructAttestationMessage, trimAddress } from '@/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Hex } from 'viem';

const AddAddressPage = () => {
  const { connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);
  const { mutateAsync: submitAddress, isPending: isVerifying } =
    useSubmitAddress();

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({ title: 'Connect Address', showBackButton: true });
  }, [setOptions]);

  const privyAddress = wallets.find(
    wallet => wallet.walletClientType === 'privy'
  )?.address;

  const connectedWallet = user
    ? wallets
        .sort((a, b) => b.connectedAt - a.connectedAt)
        .find(
          wallet =>
            wallet.walletClientType !== 'privy' &&
            !user.connectedAddresses.includes(wallet.address)
        )
    : null;

  const { data: eligibleCreddd } = useEligibleCreddd(
    (connectedWallet?.address as Hex) || null
  );

  const connectedAddressTrimmed = connectedWallet?.address
    ? trimAddress(connectedWallet?.address as Hex)
    : null;

  return (
    <div className="flex flex-col items-center h-[80%] justify-center w-full gap-y-4 py-4">
      {connectedAddressTrimmed ? (
        <>
          {eligibleCreddd && eligibleCreddd.length > 0 ? (
            <div className="flex flex-col gap-y-2">
              <div className="opacity-60">
                The address {connectedAddressTrimmed} <br />
                grants you the following creddd
              </div>
              {eligibleCreddd?.map((creddd, i) => (
                <div key={i} className="font-bold text-center text-primary">
                  <div>{creddd.displayName}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="opacity-60">
              No creddd found for {connectedAddressTrimmed}
            </div>
          )}
        </>
      ) : (
        <Button onClick={connectWallet}>Connect Wallet</Button>
      )}
      {connectedWallet ? (
        <>
          <Button
            className="mt-4"
            disabled={!connectedWallet || isVerifying}
            onClick={async () => {
              if (!privyAddress) {
                // TODO: Report error
                return;
              }

              if (!connectedWallet) {
                // TODO: Report error
                return;
              }

              const message = constructAttestationMessage(privyAddress);
              const sig = await connectedWallet.sign(message);

              await submitAddress({
                address: connectedWallet.address as Hex,
                signature: sig as Hex,
              });
            }}
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin"></Loader2>
            ) : (
              <></>
            )}
            Verify address
          </Button>
          <Button
            variant="link"
            onClick={() => {
              connectWallet();
            }}
          >
            Connect another wallet
          </Button>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default AddAddressPage;
