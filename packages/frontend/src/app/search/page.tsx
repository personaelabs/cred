/* eslint-disable @next/next/no-img-element */
'use client';
import EligibleGroup from '@/components/ui/EligibleGroup';
import Link from 'next/link';
import useEligibleGroups from '@/hooks/useEligibleGroups';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useConnectedAccounts } from '@/context/ConnectWalletContext';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import CredddSearchSpinner from '@/components/CredddSearchSpinner';

const EligibleCredddList = () => {
  const { user } = useUser();
  const { accounts, connector, isConnected } = useConnectedAccounts();
  const { eligibleGroups } = useEligibleGroups(accounts || undefined);

  if (!isConnected) {
    return <></>;
  }

  if (!user) {
    return <Loader2 className="animate-spin w-4 h-4"></Loader2>;
  }

  if (!eligibleGroups) {
    return <CredddSearchSpinner />;
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
              afterAdd={() => {}}
            ></EligibleGroup>
          ))}
        </div>
      </div>
    </>
  );
};

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-y-[30px] justify-start items-center h-[90vh] px-4">
      <div className="text-xl">Add creddd</div>
      <EligibleCredddList />
      <ConnectWalletButton label="Connect your wallets to add creddd" />
    </div>
  );
}
