/* eslint-disable @next/next/no-img-element */
'use client';

import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import WalletView from '@/components/ui/WalletView'; // Fixed import statement
import Link from 'next/link';
import useEligibleGroups from '@/hooks/useEligibleGroups';
import { Hex } from 'viem';
import { Loader2 } from 'lucide-react';
import MintInstructionModal from '@/components/MintInstructionModal';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import SwitchAccountsModal from '@/components/SwitchAccountsModal';
import { useMediaQuery } from '@/context/MediaQueryContext';
import { toast } from 'sonner';
import { trimAddress } from '@/lib/utils';

export default function AccountPage() {
  const [accounts, setAccounts] = useState<Hex[]>([]);
  const { user } = useUser();
  const [disconnectTriggered, setDisconnectTriggered] =
    useState<boolean>(false);
  const { addresses, connector } = useAccount();
  const [connectedAddress, setConnectedAddress] = useState<Hex | null>(null);
  const [metamaskProvider, setMetamaskProvider] = useState<any | null>(null);
  const eligibleGroups = useEligibleGroups(addresses as Hex[] | undefined);
  const [isMintInstructionModalOpen, setIsMintInstructionModalOpen] =
    useState<boolean>(false);
  const [isSwitchAccountsModalOpen, setIsSwitchAccountsModalOpen] =
    useState(false);
  const { openConnectModal } = useConnectModal();
  const { disconnectAsync } = useDisconnect();
  const { isMobile } = useMediaQuery();

  const isSearching = eligibleGroups === null;

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

  const addedGroups =
    user?.fidAttestations.map(attestation => attestation.MerkleTree.Group.id) ||
    [];

  return (
    <>
      <div className="flex flex-col gap-y-[30px] justify-start items-center h-[90vh] px-4">
        <div className="text-[16px] md:text-[24px]">
          Add creddd to your Farcaster account
        </div>

        {!!user && (
          <div className="flex flex-col items-center gap-y-[20px]">
            <img
              src={user.pfp_url}
              alt="profile image"
              className="w-[60px] h-[60px] rounded-full object-cover"
            ></img>
            <div>
              <div>{user.display_name} </div>
            </div>
          </div>
        )}

        {!connector ? (
          <div className="flex flex-col items-center gap-[14px]">
            <div className="opacity-80">Connect your wallets to add creddd</div>
            <Button onClick={openConnectModal}>Connect wallet</Button>
          </div>
        ) : isSearching ? (
          <div className="flex flex-row items-center">
            <Loader2 className="animate-spin mr-2 w-4 h-4"></Loader2>
            <div className="text-center">
              <div>Searching for creddd</div>
              <div>(this could take a moment...)</div>
            </div>
          </div>
        ) : (
          <>
            {eligibleGroups.length > 0 ? (
              <>
                <div className="flex flex-col gap-[4px] opacity-60">
                  <div>Current score {user?.score}</div>
                </div>
                <div className="flex flex-col h-[200px] items-center gap-y-[20px] overflow-scroll">
                  {eligibleGroups.map((group, i) => (
                    <WalletView
                      connector={connector}
                      group={group}
                      added={addedGroups.some(g => g === group.id)}
                      key={i}
                      afterAdd={() => {
                        // Open mint instruction modal if user hasn't yet
                        if (user && user.mints.length == 0) {
                          setIsMintInstructionModalOpen(true);
                        } else {
                          toast.success('creddd added', {
                            duration: 5000,
                            closeButton: true,
                          });
                        }
                      }}
                    />
                  ))}
                  {addedGroups.length > 0 ? (
                    <div className="text-sm opacity-80">
                      See what you can do with creddd{' '}
                      <Link
                        href="https://personae-labs.notion.site/Creddd-9cdf710a1cf84a388d8a45bf14ecfd20"
                        target="_blank"
                      >
                        here
                      </Link>
                    </div>
                  ) : (
                    <></>
                  )}
                  <Button variant="link" onClick={switchAccounts}>
                    Switch connected accounts
                  </Button>
                  <div className="flex flex-row items-center gap-[6px] md:gap-[12px]">
                    <div className="text-sm">
                      Connected to{' '}
                      <span className="font-bold">{connector?.name}</span>
                    </div>
                    <Button
                      variant="link"
                      className="font-normal"
                      onClick={switchWallet}
                    >
                      Use a different wallet
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="opacity-60">No creddd found</div>
            )}
          </>
        )}
      </div>
      <MintInstructionModal
        isOpen={isMintInstructionModalOpen}
        onClose={() => {
          setIsMintInstructionModalOpen(false);
        }}
      />
      <SwitchAccountsModal
        isOpen={isSwitchAccountsModalOpen}
        onClose={() => {
          setIsSwitchAccountsModalOpen(false);
        }}
        walletName={connector?.name || ''}
      ></SwitchAccountsModal>
    </>
  );
}
