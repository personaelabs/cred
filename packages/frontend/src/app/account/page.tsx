'use client';

import { useUser } from '@/context/UserContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import WalletView from '@/components/ui/WalletView'; // Fixed import statement
import { AddressToGroupsResponse } from '@/app/api/address-to-groups/route';
import { GroupSelect } from '../api/groups/route';

export default function Home() {
  const [addressesToGroups, setAddressesToGroups] =
    useState<AddressToGroupsResponse>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Explicitly define the error state to be either string or null
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupSelect[]>([]);

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
  const [groupsForAddress, setGroupsForAddress] = useState<GroupsForAddress[]>(
    []
  );

  const [accounts, setAccounts] = useState<string[]>([]);

  const { user } = useUser();

  const listenForAccountChanges = () => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccounts(accounts);
      });
    }
  };

  const connectAccounts = async () => {
    if ((window as any).ethereum) {
      // Raw dog!
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAccounts(accounts);
      listenForAccountChanges();
      // Do something with the account
    } else {
      // Handle the case when Ethereum provider is not available
      console.log('no ethereum provider');
    }
  };

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        console.time('fetchGroups');
        const response = await fetch('/api/address-to-groups'); // Assuming this URL is correct
        if (!response.ok) {
          throw new Error('Data fetch failed'); // This will be caught by the catch block
        }
        console.timeEnd('fetchGroups');

        console.time('parseResponse');
        const data = await response.json();
        setAddressesToGroups(data);
        console.timeEnd('parseResponse');

        // Load in group config too. Probably could parallelize this.
        const groupResponse = await fetch('/api/groups'); // Returns [{"handle":"dev","displayName":"Dev"}, {...]}]

        if (!groupResponse.ok) {
          throw new Error('Group fetch failed');
        }
        const groupData = (await groupResponse.json()) as GroupSelect[];
        setGroups(groupData);
      } catch (error: any) {
        // Catching error as any to access message property
        setError(error.message || 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const eligibleGroups = () => {
    const addressAndGroup: {
      address: string;
      group: string;
    }[] = [];

    for (const account of accounts) {
      if (addressesToGroups[account]) {
        for (const group of addressesToGroups[account]) {
          addressAndGroup.push({
            address: account,
            group,
          });
        }
      }
    }

    // Filter out duplicate groups
    const uniqueGroups = addressAndGroup.filter(
      ({ group }, index) =>
        index === addressAndGroup.findIndex(t => t.group === group)
    );

    return uniqueGroups.map(({ address, group }) => {
      return {
        address,
        group: groups.find(g => g.handle === group)!,
      };
    });
  };

  // A function that, given a wallet, fetches the raw groups from groupsForAddresses and select the groups by matching handle
  const getGroupsForWallet = (wallet: string) => {
    // This will return an array of groups (strings) that the wallet is a member of
    const groupsForWallet = addressesToGroups[wallet];
    // Nithing? Retrun an empty array
    if (!groupsForWallet) return [];
    return addressesToGroups[wallet].map(groupHandle => {
      // Now find the 'handle' in the groups array of objects `[{"handle":"dev","displayName":"Dev"}]` and return the displayName
      return groups.find(group => group.handle === groupHandle)!;
    });
  };

  return (
    <div className="flex flex-col gap-[30px] justify-center items-center h-[80vh]">
      <div className="text-[24px]">Add creddd to your Farcaster account</div>

      {!!user && (
        <div>
          {user?.displayName}{' '}
          <span className="opacity-50">(FID {user?.fid})</span>
        </div>
      )}

      {!isLoading && accounts.length == 0 && (
        <div className="flex flex-col gap-[14px]">
          <div className="opacity-80">Connect your wallets to add creddd</div>
          <Button onClick={connectAccounts}>
            Connect Wallets via Metamask
          </Button>
        </div>
      )}

      {isLoading && <div>Loading configuration...</div>}

      {!isLoading && accounts && accounts.length > 0 && (
        <div className="flex flex-col gap-[14px]">
          <div className="opacity-80 text-center">
            You are eligible to the following creddd
          </div>
          <div className="flex flex-col items-center gap-y-[20px]">
            {eligibleGroups().map((group, i) => (
              <WalletView
                walletAddr={group.address}
                group={group.group}
                key={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
