'use client';
import AddressVerifiedSheet from '@/components/AddressVerifiedSheet';
import ClickableBox from '@/components/ClickableBox';
import ConnectFromDifferentDeviceSheet from '@/components/ConnectFromDifferentDeviceSheet';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useEligibleCreddd from '@/hooks/useEligibleCreddd';
import useSignedInUser from '@/hooks/useSignedInUser';
import useSubmitAddress from '@/hooks/useSubmitAddress';
import useUser from '@/hooks/useUser';
import theme from '@/lib/theme';
import { constructAttestationMessage, trimAddress } from '@/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Hex } from 'viem';

const ConnectOnADifferenceDeviceButton = () => {
  const [differentDeviceSheetOpen, setIsDifferentDeviceSheetOpen] =
    useState(false);

  return (
    <>
      <ClickableBox
        className="opacity-60 underline mt-4"
        onClick={() => {
          setIsDifferentDeviceSheetOpen(true);
        }}
      >
        Connect on a different device
      </ClickableBox>
      <ConnectFromDifferentDeviceSheet
        isOpen={differentDeviceSheetOpen}
        onClose={() => {
          setIsDifferentDeviceSheetOpen(false);
        }}
      />
    </>
  );
};

const AddAddressPage = () => {
  const { connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);
  const [isVerifiedSheetOpen, setIsVerifiedSheetOpen] = useState(false);
  const {
    mutateAsync: submitAddress,
    isPending: isVerifying,
    isSuccess,
    reset,
  } = useSubmitAddress();
  const { setOptions } = useHeaderOptions();

  const router = useRouter();

  useEffect(() => {
    setOptions({ title: 'Connect Address', showBackButton: true });
  }, [setOptions]);

  const privyAddress = wallets.find(
    wallet => wallet.walletClientType === 'privy'
  )?.address;

  const connectedWallet = user
    ? wallets
        .sort((a, b) => b.connectedAt - a.connectedAt)
        .find(wallet => wallet.walletClientType !== 'privy')
    : null;

  const { data: eligibleCreddd, isFetching: isSearchingCreddd } =
    useEligibleCreddd((connectedWallet?.address as Hex) || null);

  useEffect(() => {
    if (isSuccess) {
      if (eligibleCreddd && eligibleCreddd.length > 0) {
        setIsVerifiedSheetOpen(true);
      } else {
        router.replace('/settings/connected-addresses');
      }
    }
  }, [eligibleCreddd, isSuccess, router]);

  const connectedAddressTrimmed = connectedWallet?.address
    ? trimAddress(connectedWallet?.address as Hex)
    : null;

  const onVerifyClick = useCallback(async () => {
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
      groupIds: eligibleCreddd?.map(creddd => creddd.id) || [],
    });
  }, [connectedWallet, eligibleCreddd, privyAddress, submitAddress]);

  return (
    <>
      <div className="flex flex-col items-center h-[80%] justify-center w-full gap-y-4 py-4">
        {connectedAddressTrimmed ? (
          <>
            {isSearchingCreddd ? (
              <div className="flex flex-row items-center">
                <Loader2
                  className="w-4 h-4 animate-spin mr-2"
                  color={theme.orange}
                ></Loader2>
                Searching creddd for {connectedAddressTrimmed}
              </div>
            ) : (
              <></>
            )}
            {eligibleCreddd && eligibleCreddd.length > 0 ? (
              <div className="flex flex-col">
                <div className="opacity-60">
                  The address {connectedAddressTrimmed} <br />
                  grants you access to the following rooms
                </div>
                <div className="mt-4">
                  {eligibleCreddd?.map((creddd, i) => (
                    <div
                      key={i}
                      className={`py-4 font-bold text-center text-primary border-b-2 ${i === 0 ? 'border-t-2' : ''}`}
                    >
                      <div>{creddd.displayName}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="opacity-60">
                No rooms found for {connectedAddressTrimmed}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-y-2">
            <div className="opacity-80">Connect a new address</div>
            <Button
              onClick={() => {
                connectWallet();
              }}
            >
              Connect Wallet
            </Button>
            <ConnectOnADifferenceDeviceButton />
          </div>
        )}
        {connectedWallet ? (
          <>
            <Button
              className="mt-4"
              disabled={!connectedWallet || isVerifying}
              onClick={onVerifyClick}
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
              className="text-gray-400 underline"
            >
              Switch address
            </Button>
          </>
        ) : (
          <></>
        )}
      </div>
      <AddressVerifiedSheet
        isOpen={isVerifiedSheetOpen}
        joinableRooms={
          eligibleCreddd?.map(creddd => ({
            id: creddd.id,
            displayName: creddd.displayName,
          })) || []
        }
        onClose={() => {
          setIsVerifiedSheetOpen(false);
          reset();
        }}
      ></AddressVerifiedSheet>
    </>
  );
};

export default AddAddressPage;
