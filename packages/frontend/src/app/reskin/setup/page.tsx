/* eslint-disable @next/next/no-img-element */
'use client';
import { Input } from '@/components/ui/input';
import { useConnectedAccounts } from '@/context/ConnectWalletContext';
import useEligibleGroups from '@/hooks/useEligibleGroups';
import { Checkbox } from '@/components/ui/checkbox';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UploadIcon } from 'lucide-react';
import CredddSearchSpinner from '@/components/CredddSearchSpinner';
import Image from 'next/image';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { EligibleGroup } from '@/app/types';
// import useCreateAccount from '@/hooks/useCreateAccount';

interface EligibleCredddListProps {
  setSelectedCreddd: React.Dispatch<React.SetStateAction<string[] | null>>;
  eligibleGroups: EligibleGroup[] | null;
}

const EligibleCredddList = (props: EligibleCredddListProps) => {
  const { setSelectedCreddd, eligibleGroups } = props;

  if (!eligibleGroups) {
    return (
      <div>
        <CredddSearchSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-[14px] h-[220px] overflow-y-scroll border-b-slate-800 border py-2 px-6 rounded-lg">
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
            <div key={i} className="flex flex-row items-center">
              <Checkbox
                id={group.id}
                onClick={() => {
                  setSelectedCreddd(prev => {
                    if (prev?.includes(group.id)) {
                      return prev?.filter(id => id !== group.id);
                    }
                    return [...(prev || []), group.id];
                  });
                }}
                className="mr-2"
              ></Checkbox>
              <div>{group.displayName}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const ReskinSetupPage = () => {
  const { accounts } = useConnectedAccounts();
  const { eligibleGroups } = useEligibleGroups(accounts);
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [selectedCreddd, setSelectedCreddd] = useState<string[] | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  // const { createAccount } = useCreateAccount();

  const handleCreateAccountClick = useCallback(() => {
    if (!selectedCreddd) {
      return;
    }
    // create account with selected creddd
  }, [selectedCreddd]);

  const handleUploadProfileImageClick = useCallback(() => {
    profileImageInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col items-center w-full gap-y-[40px] mt-8">
      <div className="flex flex-col items-center gap-y-[4px]">
        <div className="text-lg">reskinnn</div>
        <div>create a Farcaster anon from your creddd</div>
      </div>
      <div className="flex flex-col items-center gap-y-[4px]">
        {profileImage ? (
          <img
            src={URL.createObjectURL(profileImage)}
            alt="profile image"
            className="w-[60px] h-[60px] rounded-full object-cover"
            onClick={handleUploadProfileImageClick}
          ></img>
        ) : (
          <div className="relative">
            <UploadIcon
              className="w-4 h-6 absolute inset-0 m-auto cursor-pointer"
              onClick={handleUploadProfileImageClick}
            ></UploadIcon>
            <Image
              src="/user-icon.png"
              alt="profile image"
              width={60}
              height={60}
            ></Image>
          </div>
        )}
        <Input
          type="file"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              setProfileImage(file);
            }
          }}
          className="hidden"
          ref={profileImageInputRef}
        ></Input>
      </div>
      <div className="flex flex-col items-center gap-y-[4px]">
        <Input
          placeholder="name"
          required={true}
          onChange={e => {
            setDisplayName(e.target.value);
          }}
          value={displayName}
          className="w-[220px]"
        ></Input>
        <Textarea
          placeholder="bio"
          required={false}
          onChange={e => {
            setBio(e.target.value);
          }}
          value={bio}
          className="w-[220px]"
        ></Textarea>
      </div>
      <div className="flex flex-col items-center gap-[8px]">
        <div>selected creddd to reskin with</div>
        <EligibleCredddList
          eligibleGroups={eligibleGroups}
          setSelectedCreddd={setSelectedCreddd}
        ></EligibleCredddList>
      </div>
      <ConnectWalletButton label=""></ConnectWalletButton>
      {eligibleGroups && eligibleGroups.length > 0 ? (
        <div className="flex flex-col items-center gap-y-[8px] w-[400px]">
          Your identity is hidden among 80 others
          <Progress
            value={80}
            className="w-[60%] h-[8px]"
            indicatorColor="#0BB95B"
          ></Progress>
        </div>
      ) : (
        <></>
      )}
      <Separator className="w-[40%]"></Separator>
      <div className="flex flex-col items-center gap-[4px]">
        <Button onClick={handleCreateAccountClick}>Create account</Button>
        <div className="opacity-60">fee 0.0005ETH ~= $10</div>
      </div>
    </div>
  );
};

export default ReskinSetupPage;
