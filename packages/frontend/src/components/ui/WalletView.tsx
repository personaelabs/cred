'use client';
import React, { useState } from 'react';

import { Hex, createWalletClient, custom } from 'viem';
import { Button } from '@/components/ui/button';
import { mainnet } from 'viem/chains';
import useProver from '@/hooks/useProver';
import { GroupSelect } from '@/app/api/groups/route';
import { postJSON } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Assuming demoSignMessage is defined elsewhere and imported
// import { demoSignMessage } from 'wherever-this-function-is-defined';

interface WalletViewProps {
  walletAddr: string;
  groups: GroupSelect[];
}

const WalletView: React.FC<WalletViewProps> = ({ walletAddr, groups }) => {
  const [isAdding, setIsAdding] = useState(false);
  const prover = useProver();

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
    }
    setIsAdding(false);
  };

  return (
    <div
      className={`flex flex-col items-center ${groups.length > 0 ? 'bg-[#404040] text-white p-4 rounded-lg' : ''}`}
    >
      <h2 className="font-mono">{walletAddr}</h2>

      {groups && groups.length > 0 && (
        <section className="flex mt-2">
          {groups.map((group, i) => (
            <span key={i} className="">
              <span className="font-bold text-lg">{group.displayName}</span>
              <Button
                onClick={() => addGroup(walletAddr, group.handle)}
                disabled={isAdding}
                className="rounded transition-all bg-white text-black ml-2 hover:bg-black hover:text-white px-4 py-1"
              >
                {isAdding ? (
                  <Loader2 className="animate-spin mr-2 w-4 h-4"></Loader2>
                ) : (
                  <></>
                )}
                Add
              </Button>
            </span>
          ))}
        </section>
      )}
    </div>
  );
};

export default WalletView;
