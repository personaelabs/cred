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
// import useCreateAccount from '@/hooks/useCreateAccount';

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
      <div>reskin</div>
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
              className="w-6 h-6 absolute inset-0 m-auto cursor-pointer"
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
        <div className="flex flex-col gap-[8px] h-[150px] overflow-y-scroll border-b-slate-800 border py-4 px-8 rounded-lg">
          {eligibleGroups ? (
            eligibleGroups.map((group, i) => (
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
            ))
          ) : (
            <CredddSearchSpinner />
          )}
        </div>
      </div>
      <ConnectWalletButton label=""></ConnectWalletButton>
      <div className="flex flex-col items-center gap-y-[8px] w-[400px]">
        Your identity is hidden among 80 others
        <Progress value={80} className="w-[60%] h-[8px]"></Progress>
      </div>
      <Separator className="w-[40%]"></Separator>
      <Button onClick={handleCreateAccountClick}>Create account</Button>
    </div>
  );
};

export default ReskinSetupPage;
