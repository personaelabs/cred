import React from 'react';


import { createWalletClient, custom } from 'viem'
import { Button } from '@/components/ui/Button';
import { mainnet } from 'viem/chains'

// Assuming demoSignMessage is defined elsewhere and imported
// import { demoSignMessage } from 'wherever-this-function-is-defined';

interface WalletViewProps {
  walletAddr: string;
  groups: string[];
}

  
const addGroup = async (addr:string, group:string) => {
  // Viem!
  const client = createWalletClient({
    account: addr as `0x${string}`,
    chain: mainnet,
    transport: custom(window.ethereum)
  })
  await client.signMessage({message: `Do something here for wallet ${addr} and group ${group}!`})
  
}

const WalletView: React.FC<WalletViewProps> = ({ walletAddr, groups }) => {
  return (
    <div className={`flex flex-col items-center ${groups.length > 0 ? 'bg-[#404040] text-white p-4 rounded-lg' : ''}`}>


      <h2 className="font-mono">{walletAddr}</h2>

      {groups && groups.length > 0 && (
        <section className="flex mt-2">
          {groups.map((group: string) => (
            <span key={group} className="">
              <span className="font-bold text-lg">
              {group}
              </span>
              <button
              onClick={() => addGroup(walletAddr, group)}
              className="rounded transition-all bg-white text-black px-2 ml-2 hover:bg-black hover:text-white px-4 py-1
              "
              >Add</button>
            </span>
          ))}
        </section>
      )}
    </div>
  );
};

export default WalletView;
