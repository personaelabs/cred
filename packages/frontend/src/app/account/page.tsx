'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import WalletView from '@/components/ui/WalletView'; // Fixed import statement
import { AddressToGroupsResponse } from '@/app/api/address-to-groups/route'

export default function Home() {
  const router = useRouter();


  const [addressesToGroups, setAddressesToGroups] = useState<AddressToGroupsResponse>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Explicitly define the error state to be either string or null
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<string[]>([])

  // An object like so: [{"handle":"dev","displayName":"Dev"}, ..{}], define an interface:
  interface Group {
    handle: string;
    displayName: string;
  }

  // Now i want a groupsForAddress array interface:
  interface GroupsForAddress {
    address: string;
    groups: Group[];
  }

  // Now a setter for the groupsForAddress state:
  const [groupsForAddress, setGroupsForAddress] = useState<GroupsForAddress[]>([]);

  const [accounts, setAccounts] = useState<string[]>([])

  const { user } = useUser();

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

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/address-to-groups'); // Assuming this URL is correct
        if (!response.ok) {
          throw new Error('Data fetch failed'); // This will be caught by the catch block
        }
        const data = await response.json();
        setAddressesToGroups(data);

        // Load in group config too. Probably could parallelize this.
        const groupResponse = await fetch('/api/groups'); // Returns [{"handle":"dev","displayName":"Dev"}, {...]}]
        if (!groupResponse.ok) {
          throw new Error('Group fetch failed');
        }
        const groupData = await groupResponse.json();
        setGroups(groupData);

      } catch (error: any) { // Catching error as any to access message property
        setError(error.message || 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);


  // Returns any accounts that has a group in the addressToGroups object
  // Return an array of strings.
  const elibigleWallets = () => {
    return accounts.filter((account) => {
      return addressesToGroups[account] && addressesToGroups[account].length > 0
    })
  }



  // A function that, given a wallet, fetches the raw groups from groupsForAddresses and select the groups by matching handle
  const getGroupsForWallet = (wallet: string) => {
    // This will return an array of groups (strings) that the wallet is a member of
    const groupsForWallet = addressesToGroups[wallet]
    // Nithing? Retrun an empty array
    if (!groupsForWallet) return [];
    return addressesToGroups[wallet].map((groupHandle) => {
      // Now find the 'handle' in the groups array of objects `[{"handle":"dev","displayName":"Dev"}]` and return the displayName
      return groups.find((group) => group.handle === groupHandle)?.displayName;
    })
  }

  return (
    <div className="flex flex-col justify-center items-center h-[80vh] gap-10">

      <h2
        className="text-3xl font-bold"
      >
        Hello {user?.displayName || "anon"} <span className="opacity-50">(FID {user?.fid})</span>
      </h2>

      {!isLoading && accounts.length == 0 && (
        <div>
          <Button onClick={connectAccounts} type="button">Connect Wallets via Metamask</Button>
        </div>
      )}

      {isLoading && (
        <div>
          Loading configuration...
        </div>
      )}


      <div>
        {!isLoading && accounts && accounts.length > 0 && (
          <div>
          <div>
            <h3 className="text-xl font-bold text-center mb-4">Connected Wallets Eligible for Creddd </h3>
            <div className="flex flex-col gap-y-8">
              {elibigleWallets().map((account) => (
                <WalletView walletAddr={account}
                key={account}
                groups={getGroupsForWallet(account) || []}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-center mb-4 mt-10">Wallets Not Eligible for Creddd </h3>
            <div className="flex flex-col gap-y-2 opacity-50">
              {accounts.filter((account) => !elibigleWallets().includes(account)).map((account) => (
                <WalletView walletAddr={account}
                key={account}
                groups={getGroupsForWallet(account) || []}
                />
              ))}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
