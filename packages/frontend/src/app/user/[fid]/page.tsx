'use client';
import useUser from '@/hooks/useUser';
import { Check } from 'lucide-react';
import Image from 'next/image';

const UserPage = ({ params: { fid } }: { params: { fid: string } }) => {
  const user = useUser(fid);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-y-[30px]">
      <Image
        className="rounded-full object-cover w-[60px] h-[60px]"
        src={user.pfp_url}
        alt="User profile image"
        width={60}
        height={60}
      ></Image>
      <div>
        <div>{user.display_name} </div>
        <div className="opacity-50">(FID {user?.fid})</div>
      </div>
      <div className="ml-2 flex flex-col gap-y-[10px]">
        {user.fidAttestations.map((attestation, i) => (
          <div key={i} className="flex flex-row items-center">
            <Check className="w-4 h-4 mr-2" color="#FDA174"></Check>
            <div>{attestation.MerkleTree.Group.displayName}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPage;
