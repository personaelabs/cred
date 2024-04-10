/* eslint-disable @next/next/no-img-element */
'use client';
import CredddSearchSpinner from '@/components/CredddSearchSpinner';
import DeleteRecoveryPhraseModal from '@/components/DeleteRecoveryPhraseModal';
import ExportRecoveryPhraseModal from '@/components/ExportRecoveryPhraseModal';
import EligibleGroup from '@/components/ui/EligibleGroup';
import { Button } from '@/components/ui/button';
import { useConnectedAccounts } from '@/context/ConnectWalletContext';
import { useReskinFcUser } from '@/context/ReskinFcUserContext';
import useEligibleGroups from '@/hooks/useEligibleGroups';
import useUserData from '@/hooks/useUserData';
import { deleteCustodyAccount } from '@/lib/reskin';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const EligibleCredddList = () => {
  const { accounts, connector, isConnected } = useConnectedAccounts();
  const { eligibleGroups } = useEligibleGroups(accounts || undefined);

  if (!isConnected) {
    return <></>;
  }

  if (!eligibleGroups) {
    return <CredddSearchSpinner />;
  }

  return (
    <>
      <div className="flex flex-col gap-[14px]">
        <div className="opacity-80 text-center">
          {eligibleGroups.length === 0 ? (
            <>
              <div>No creddd found for connected wallet.</div>
            </>
          ) : (
            <></>
          )}
        </div>
        <div className="flex flex-col max-h-[400px] items-center gap-y-[20px] overflow-scroll">
          {eligibleGroups.map((group, i) => (
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

const ReskinAttachCredddPage = () => {
  const { signedInUser } = useReskinFcUser();
  const [isExportRecoveryPhraseModalOpen, setIsExportRecoveryPhraseModalOpen] =
    useState<boolean>(false);

  const [isDeleteRecoveryPhraseModalOpen, setIsDeleteRecoveryPhraseModalOpen] =
    useState<boolean>(false);

  const router = useRouter();

  // Hook to redirect to the reskin home page if the user is not signed in
  useEffect(() => {
    if (!signedInUser) {
      router.push('/reskin');
    }
  }, [router, signedInUser]);

  const userData = useUserData(signedInUser?.fid.toString() || null);

  if (!userData) {
    return (
      <div className="flex flex-col items-center w-full gap-y-[40px] mt-8">
        <Loader2 className="animate-spin w-4 h-4"></Loader2>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center w-full gap-y-[40px] mt-8">
        <div className="flex flex-col items-center gap-y-[20px]">
          <img
            src={userData.pfp_url}
            alt="profile image"
            className="w-[60px] h-[60px] rounded-full object-cover"
          ></img>
          <div>
            <div className="flex flex-row items-center">
              {userData.display_name}
            </div>
            <div className="opacity-50">(FID {userData?.fid})</div>
          </div>
        </div>
        <div>
          <div className="text-center">
            Account created. <br></br> Attach creddd to your account
          </div>
        </div>
        <EligibleCredddList></EligibleCredddList>
        <div>
          <Button
            variant="link"
            className="underline"
            onClick={() => {
              setIsExportRecoveryPhraseModalOpen(true);
            }}
          >
            Next
          </Button>
        </div>
      </div>
      <ExportRecoveryPhraseModal
        isOpen={isExportRecoveryPhraseModalOpen}
        onClose={() => {
          setIsExportRecoveryPhraseModalOpen(false);
          setIsDeleteRecoveryPhraseModalOpen(true);
        }}
      ></ExportRecoveryPhraseModal>
      <DeleteRecoveryPhraseModal
        isOpen={isDeleteRecoveryPhraseModalOpen}
        onClose={() => {
          setIsDeleteRecoveryPhraseModalOpen(false);
        }}
        onDelete={() => {
          deleteCustodyAccount();
          router.push('/reskin');
          setIsDeleteRecoveryPhraseModalOpen(false);
        }}
      ></DeleteRecoveryPhraseModal>
    </>
  );
};

export default ReskinAttachCredddPage;
