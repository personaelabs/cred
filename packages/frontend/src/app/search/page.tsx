/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import EligibleGroup from '@/components/ui/EligibleGroup';
import Link from 'next/link';
import useEligibleGroups from '@/hooks/useEligibleGroups';
import { Hex } from 'viem';
import { Loader2 } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import SwitchAccountsModal from '@/components/SwitchAccountsModal';
import { useMediaQuery } from '@/context/MediaQueryContext';
import { toast } from 'sonner';
import { trimAddress } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

const EligibleCredddList = () => {
  const { user } = useUser();
  const [accounts, setAccounts] = useState<Hex[]>([]);
  const [disconnectTriggered, setDisconnectTriggered] =
    useState<boolean>(false);
  const { addresses, connector } = useAccount();
  const [connectedAddress, setConnectedAddress] = useState<Hex | null>(null);
  const [metamaskProvider, setMetamaskProvider] = useState<any | null>(null);
  const { eligibleGroups } = useEligibleGroups(addresses as Hex[] | undefined);
  const [isSwitchAccountsModalOpen, setIsSwitchAccountsModalOpen] =
    useState(false);
  const { openConnectModal } = useConnectModal();
  const { disconnectAsync } = useDisconnect();
  const { isMobile } = useMediaQuery();

  // Get the Metamask provider if it's available
  useEffect(() => {
    window.addEventListener('eip6963:announceProvider', (event: any) => {
      const _provider = event.detail.provider;
      const providerRDns = event.detail.info.rdns;
      if (providerRDns === 'io.metamask') {
        setMetamaskProvider(_provider);
      }
    });

    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }, []);

  // Hook to close the switch account modal when the user has switched accounts
  useEffect(() => {
    if (accounts) {
      const latestAddress = accounts[0];
      const accountChanged = latestAddress !== connectedAddress;
      if (accountChanged && isSwitchAccountsModalOpen) {
        setIsSwitchAccountsModalOpen(false);
      }
      setConnectedAddress(latestAddress);
    }
  }, [accounts, connectedAddress, isSwitchAccountsModalOpen]);

  // Hook to open the connect modal when the user clicked "switch accounts"
  useEffect(() => {
    // We open the connect modal wehn the user has clicked "switch accounts",
    // which triggers a disconnect
    if (disconnectTriggered && openConnectModal) {
      openConnectModal();
    }
  }, [disconnectTriggered, openConnectModal]);

  // If accounts are found, we can assume that the user has re-connected
  // and set `disconnectTriggered` to false
  useEffect(() => {
    if (accounts.length > 0) {
      if (disconnectTriggered) {
        setDisconnectTriggered(false);
      }
    }
  }, [accounts, disconnectTriggered]);

  const switchAccounts = async () => {
    if (!connector) {
      throw new Error("Can't switch wallets without a connector.");
    }

    if (connector.id === 'metaMask' || connector.id === 'io.metamask') {
      await disconnectAsync();

      // If we are connected to metamask, we can disconnect by revoking permissions
      // and requesting accounts again
      metamaskProvider.request({
        method: 'wallet_revokePermissions',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });

      // Request accounts again
      await metamaskProvider.request({
        method: 'eth_requestAccounts',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
    } else {
      const isWalletConnect =
        connector.id === 'walletConnect' || connector.type === 'walletConnect';

      if (isMobile || isWalletConnect) {
        // Disconnect if we are on mobile.
        // On mobile, rainbowkit opens the connect modal again
        // when the account is disconnected.
        await disconnectAsync();
        setDisconnectTriggered(true);
      } else {
        // Show modal that instructs user to disconnect on desktop
        setIsSwitchAccountsModalOpen(true);
      }
    }
  };

  const switchWallet = async () => {
    await disconnectAsync();
    // Set disconnectTriggered to true to open the Rainbowkit connect modal
    setDisconnectTriggered(true);
  };

  useEffect(() => {
    if (accounts.length < 4) {
      for (const address of accounts) {
        toast.info(`Connected to ${trimAddress(address)}`, {
          closeButton: true,
          duration: 2000,
        });
      }
    } else {
      toast.info(`Connected to ${accounts.length} addresses`, {
        closeButton: true,
        duration: 2000,
      });
    }
  }, [accounts]);

  useEffect(() => {
    if (connector?.name) {
      toast.success(`Connected to ${connector.name}`, {
        closeButton: true,
        duration: 2000,
      });
    }
  }, [connector?.name]);

  // Set the `accounts` when they are found
  useEffect(() => {
    if (addresses) {
      // Update `accounts`, only if the addresses are different.
      // This is to prevent unnecessary re-renders
      if (addresses.some((address, i) => address !== accounts[i])) {
        setAccounts(addresses as Hex[]);
      }
    }
  }, [accounts, addresses]);

  if (!user) {
    return <Loader2 className="animate-spin w-4 h-4"></Loader2>;
  }

  if (!connector) {
    return (
      <div className="flex flex-col items-center gap-[14px]">
        <div className="opacity-80">Connect your wallets to add creddd</div>
        <Button onClick={openConnectModal}>Connect wallet</Button>
      </div>
    );
  }

  if (!eligibleGroups) {
    return (
      <div className="flex flex-row items-center">
        <Loader2 className="animate-spin mr-2 w-4 h-4"></Loader2>
        <div className="text-center">
          <div>Searching for creddd</div>
          <div>(this could take a moment...)</div>
        </div>
      </div>
    );
  }

  const addedGroupIds = user.groups.map(group => group.id);
  const unaddedEligibleGroups = eligibleGroups.filter(
    group => !addedGroupIds.includes(group.id)
  );

  return (
    <>
      <div className="flex flex-col gap-[14px]">
        <div className="opacity-80 text-center">
          {unaddedEligibleGroups.length === 0 ? (
            <>
              <div>No creddd found for connected wallet.</div>
              <div>
                You have{' '}
                <Link href="/account"> {user.groups.length} creddd </Link>{' '}
                already attached to your account.{' '}
              </div>
            </>
          ) : (
            <>Found the following creddd:</>
          )}
        </div>
        <div className="flex flex-col max-h-[400px] items-center gap-y-[20px] overflow-scroll">
          {unaddedEligibleGroups.map((group, i) => (
            <EligibleGroup
              connector={connector!}
              group={group}
              key={i}
              added={false}
              afterAdd={() => {}}
            ></EligibleGroup>
          ))}
        </div>
        <Button variant="link" onClick={switchAccounts}>
          Switch connected accounts
        </Button>
        <div className="flex flex-row items-center gap-[6px] md:gap-[12px]">
          <div className="text-sm">
            Connected to <span className="font-bold">{connector?.name}</span>
          </div>
          <Button variant="link" className="font-normal" onClick={switchWallet}>
            Use a different wallet
          </Button>
        </div>
      </div>
      <SwitchAccountsModal
        isOpen={isSwitchAccountsModalOpen}
        onClose={() => {
          setIsSwitchAccountsModalOpen(false);
        }}
        walletName={connector?.name || ''}
      ></SwitchAccountsModal>
    </>
  );
};

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-y-[30px] justify-start items-center h-[90vh] px-4">
      <div className="text-xl">Add creddd</div>
      <EligibleCredddList />
    </div>
  );
}
