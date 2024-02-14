'use client';
import React, { useState } from 'react';

import { Hex, createWalletClient, custom } from 'viem';
import { Button } from '@/components/ui/button';
import { mainnet } from 'viem/chains';
import useProver from '@/hooks/useProver';
import { GroupSelect } from '@/app/api/groups/route';
import { postJSON } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { group } from 'console';

// Assuming demoSignMessage is defined elsewhere and imported
// import { demoSignMessage } from 'wherever-this-function-is-defined';

interface WalletViewProps {
  walletAddr: string;
  group: GroupSelect;
}

const WalletView: React.FC<WalletViewProps> = ({ walletAddr, group }) => {
  const [isAdding, setIsAdding] = useState(false);
  const prover = useProver();
  const [added, setAdded] = useState(false);

  const addGroup = async (addr: string, groupHandle: string) => {
    // Viem!
    const client = createWalletClient({
      account: addr as Hex,
      chain: mainnet,
      // @ts-ignore
      transport: custom(window.ethereum),
    });

    setIsAdding(true);
    const proof = await prover.prove(addr as Hex, client, groupHandle);

    if (proof) {
      await postJSON({
        method: 'POST',
        url: '/api/attestations',
        body: proof,
      });

      toast.success(`Successfully added creddd!`);

      setAdded(true);
    }
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row items-center justify-center gap-[20px] w-[300px]">
        <div className="text-center w-[200px]">{group.displayName}</div>
        <div className="w-[85px] text-center">
          <Button
            onClick={() => addGroup(walletAddr, group.handle)}
            disabled={isAdding || added}
          >
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
