'use client';

import AddingCredddModal from '@/components/AddingCredddModal';
import Scrollable from '@/components/Scrollable';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useEligibleCreddd from '@/hooks/useEligibleCreddd';
import useAddCreddd from '@/hooks/usesAddCreddd';
import theme from '@/lib/theme';
import { trimAddress } from '@/lib/utils';
import { EligibleCreddd } from '@/types';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAccount, useDisconnect } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

const ConnectButton = () => {
  const { connectWallet } = usePrivy();

  return (
    <Button
      onClick={() => {
        connectWallet();
      }}
    >
      Connect wallet
    </Button>
  );
};

const SwitchAddressButton = () => {
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  return (
    <Button
      onClick={() => {
        disconnect();
      }}
      disabled={isDisconnecting}
    >
      {isDisconnecting ? (
        <Loader2
          className="mr-2 w-4 h-4 animate-spin"
          color={theme.orange}
        ></Loader2>
      ) : (
        <></>
      )}
      Switch address
    </Button>
  );
};

const AddCredddPage = () => {
  const { address } = useAccount();
  const {
    data: eligibleCreddd,
    isFetching: isSearchingCreddd,
    refetch,
  } = useEligibleCreddd(address || null);
  const { setOptions } = useHeaderOptions();
  const {
    mutateAsync: addCreddd,
    isPending: isAddingCreddd,
    isSuccess,
    hasSignedMessage,
  } = useAddCreddd();

  useEffect(() => {
    setOptions({
      title: 'Add creddd',
      showBackButton: true,
    });
  }, [setOptions]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(`creddd added`, {
        duration: 60000,
        closeButton: true,
      });
    }
  }, [isSuccess]);

  const onAddClick = useCallback(
    async (creddd: EligibleCreddd) => {
      await addCreddd(creddd);
      await refetch();
    },
    [addCreddd, refetch]
  );

  return (
    <>
      <Scrollable>
        <div className="h-full flex flex-col items-center overflow-auto">
          <div className="flex flex-col mt-3 w-full">
            {isSearchingCreddd ? (
              <div className="flex flex-row items-center justify-center mt-3">
                <Loader2
                  className="mr-2 w-4 h-4 animate-spin"
                  color={theme.orange}
                ></Loader2>
                <div>Searching eligible creddd...</div>
              </div>
            ) : (
              <></>
            )}
            {!isSearchingCreddd && eligibleCreddd?.length === 0 ? (
              <div className="flex flex-row items-center justify-center mt-3 opacity-60">
                <div>No eligible creddd found</div>
              </div>
            ) : (
              <></>
            )}
            {address &&
              eligibleCreddd?.map(creddd => (
                <div
                  key={creddd.id}
                  className="flex flex-row items-center justify-center w-full border-b-2 py-3"
                >
                  <div className="w-[50%] text-center">
                    {creddd.displayName}
                  </div>
                  <Button
                    className="ml-2"
                    variant="secondary"
                    onClick={() => {
                      onAddClick(creddd);
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))}
            <div className="gap-y-2 flex flex-col items-center mt-10">
              {address ? (
                <div className="text-center bg-clip-text text-transparent bg-gradient-to-l from-purple-400 to-purple-600">
                  Connected: {trimAddress(address)}
                </div>
              ) : (
                <></>
              )}
              {address ? (
                <SwitchAddressButton></SwitchAddressButton>
              ) : (
                <ConnectButton></ConnectButton>
              )}
            </div>
          </div>
        </div>
      </Scrollable>
      <AddingCredddModal
        isOpen={isAddingCreddd}
        hasSignedMessage={hasSignedMessage}
      ></AddingCredddModal>
    </>
  );
};

export default AddCredddPage;
