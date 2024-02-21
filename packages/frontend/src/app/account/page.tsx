/* eslint-disable @next/next/no-img-element */
'use client';

import { useUser } from '@/context/UserContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import WalletView from '@/components/ui/WalletView'; // Fixed import statement
import Link from 'next/link';
import useEligibleGroups from '@/hooks/useEligibleGroups';
import { Hex } from 'viem';
import { Loader2 } from 'lucide-react';
import BotInstructionModal from '@/components/BotInstructionModal';

export default function AccountPage() {
  const [accounts, setAccounts] = useState<Hex[]>([]);
  const { user } = useUser();
  const [isSwitchingWallets, setIsSwitchingWallets] = useState<boolean>(false);
  const eligibleGroups = useEligibleGroups(accounts);
  const [isBotInstructionModalOpen, setIsBotInstructionModalOpen] =
    useState<boolean>(false);

  const isLoading = eligibleGroups === null;

  const listenForAccountChanges = () => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: Hex[]) => {
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

  const switchWallets = async () => {
    if ((window as any).ethereum) {
      setIsSwitchingWallets(true);
      await (window as any).ethereum.request({
        method: 'wallet_revokePermissions',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });

      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
      setAccounts(accounts);
      setIsSwitchingWallets(false);
    }
  };

  const addedGroups =
    user?.fidAttestations.map(attestation => attestation.MerkleTree.Group.id) ||
    [];

  return (
    <>
      <div className="flex flex-col gap-y-[30px] justify-start items-center h-[90vh]">
        <div className="text-[24px]">Add creddd to your Farcaster account</div>

        {!!user && (
          <div className="flex flex-col items-center gap-y-[20px]">
            <img
              src={user.pfp_url}
              alt="profile image"
              className="w-[60px] h-[60px] rounded-full object-cover"
            ></img>
            <div>
              <div>{user.display_name} </div>
              <div className="opacity-50">(FID {user?.fid})</div>
            </div>
          </div>
        )}

        {accounts.length == 0 && !isSwitchingWallets && (
          <div className="flex flex-col gap-[14px]">
            <div className="opacity-80">Connect your wallets to add creddd</div>
            <Button onClick={connectAccounts}>
              Connect Wallets via Metamask
            </Button>
          </div>
        )}

        {accounts.length > 0 && isLoading ? (
          <div className="flex flex-row items-center">
            <Loader2 className="animate-spin mr-2 w-4 h-4"></Loader2>
            Searching for creddd (this could take a moment...)
          </div>
        ) : accounts.length > 0 && !isLoading ? (
          <div className="flex flex-col gap-[14px]">
            <div className="opacity-80 text-center">
              {eligibleGroups.length === 0 ? (
                <>No creddd found for connected wallets</>
              ) : (
                <>Found the following creddd:</>
              )}
            </div>
            <div className="flex flex-col h-[200px] items-center gap-y-[20px] overflow-scroll">
              {eligibleGroups.map((group, i) => (
                <WalletView
                  walletAddr={group.address}
                  group={group}
                  added={addedGroups.some(g => g === group.id)}
                  key={i}
                  afterAdd={() => {
                    setIsBotInstructionModalOpen(true);
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
              <Button variant="link" onClick={switchWallets}>
                Switch wallets
              </Button>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
      <BotInstructionModal
        isOpen={isBotInstructionModalOpen}
        onClose={() => setIsBotInstructionModalOpen(false)}
      />
    </>
  );
}
