'use client';
import { useRouter } from 'next/navigation';


import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { base } from 'viem/chains'
import { createWalletClient, custom } from 'viem'

export default function Home() {
  const router = useRouter();
  

  const [accounts, setAccounts] = useState<string[]>([])

  const { user, loginWithFarcaster, addWalletAddress, removeWalletAddress } = useUser();

  const listenForAccountChanges = () => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccounts(accounts)
      })
    }
  }

  const connectAccounts = async () => {
    if ((window as any).ethereum) {
      // Raw dog!
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      setAccounts(accounts)
      listenForAccountChanges()
      // Do something with the account
    } else {
      // Handle the case when Ethereum provider is not available
      console.log('no ethereum provider')
    }
  }
  
  const demoSignMessage = async (addr:string) => {
    // Viem!
    const client = createWalletClient({
      account: addr as `0x${string}`,
      chain: base,
      transport: custom(window.ethereum)
    })
    await client.signMessage({message: `hello from ${addr}`})
    
  }

  // const { disconnect } = useDisconnect();
  // Watch for account connection, when it happens add it to the list:
  // useEffect(() => {
  //   console.log('isConnected', isConnected, address)
  //   if (isConnected && address) {
  //     addWalletAddress(address)
  //   }
  // }, [isConnected, address])

  return (
    <div className="flex flex-col justify-center items-center h-[80vh] gap-10">

      <h2
        className="text-3xl font-bold"
      >
        Hello {user?.displayName || "anon"} <span className="opacity-50">(FID {user?.fid})</span>
      </h2>

{ accounts.length == 0 && (
      <div>
        <button onClick={connectAccounts} type="button">Connect Wallets via Metamask</button>
      </div>
)}



      <div>
        {accounts && accounts.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Connected Wallets</h3>
            <div>
              {(accounts).map((account) => (
                <div key={account}
                className="flex items-center font-mono mb-2" 
                >{account}

                <button
                className="bg-blue-500 text-white px-2 rounded ml-2"
                onClick={() => {
                  demoSignMessage(account)
                }}>
                  Sign a Message
                </button>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
