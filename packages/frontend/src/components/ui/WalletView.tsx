'use client';
import React, { useState } from 'react';

import { Hex, createWalletClient, custom } from 'viem';
import { Button } from '@/components/ui/button';
import { mainnet } from 'viem/chains';
import useProver from '@/hooks/useProver';
import { captureFetchError, getCredddDescription, postJSON } from '@/lib/utils';
import { Check, Info, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { EligibleGroup } from '@/app/types';

interface WalletViewProps {
  walletAddr: string;
  group: EligibleGroup;
  added: boolean;
  afterAdd: () => void;
}

const WalletView: React.FC<WalletViewProps> = ({
  walletAddr,
  group,
  ...props
}) => {
  const { refetchUser } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const prover = useProver(group);
  const [added, setAdded] = useState(props.added);

  const addGroup = async () => {
    // Viem!
    const client = createWalletClient({
      account: walletAddr as Hex,
      chain: mainnet,
      // @ts-ignore
      transport: custom(window.ethereum),
    });

    setIsAdding(true);
    const proof = await prover.prove(client);

    if (proof) {
      const response = await postJSON({
        method: 'POST',
        url: '/api/attestations',
        body: proof,
      });

      if (response.ok) {
        setAdded(true);
        refetchUser();
        props.afterAdd();
      } else {
        toast.error('Failed to add creddd', {
          duration: 100000,
          closeButton: true,
        });
        await captureFetchError(response);
      }
    }

    setIsAdding(false);
  };

  const credddDescription = group.typeId
    ? getCredddDescription(group.displayName, group.typeId)
    : null;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row items-center justify-center gap-[20px] w-[300px]">
        <div className="flex flex-row items-center">
          <div className="text-center w-[150px]">{group.displayName}</div>
          {credddDescription ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger>
                <Info className="w-4 h-4 ml-2"></Info>
              </TooltipTrigger>
              <TooltipContent>{credddDescription}</TooltipContent>
            </Tooltip>
          ) : (
            <></>
          )}
        </div>
        <div className="w-[85px] text-center">
          <Button onClick={addGroup} disabled={isAdding || added}>
            {isAdding ? (
              <Loader2 className="animate-spin mr-2 w-4 h-4"></Loader2>
            ) : (
              <></>
            )}
            {added ? <Check className="w-4 h-4 mr-1" /> : <></>}
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
