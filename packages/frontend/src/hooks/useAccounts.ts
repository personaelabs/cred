import { useEffect, useState } from 'react';
import { Hex } from 'viem';

import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';

export const useConnectedAccounts = (isConnected: boolean) => {
  const [connectedAccounts, setConnectedAccounts] = useState<Hex[]>([]);

  useEffect(() => {
    (async () => {
      if (isConnected) {
        const walletClient = createWalletClient({
          chain: mainnet,
          // @ts-ignore
          transport: custom(window.ethereum),
        });

        const accounts = await walletClient.getAddresses();
        setConnectedAccounts(accounts);
      }
    })();
  }, [isConnected]);

  return { connectedAccounts };
};
