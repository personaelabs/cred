/* eslint-disable @next/next/no-img-element */
'use client';

import { useUser } from '@/context/UserContext';
import CredddBadge from '@/components/CredddBadge';
import { GetUserResponse } from '../api/fc-accounts/[fid]/route';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AddedCredddListProps {
  user: GetUserResponse | null;
}

const AddedCredddList = (props: AddedCredddListProps) => {
  const { user } = props;

  return (
    <div className="flex gap-y-[15px] flex-col items-center justify-center overflow-y-scroll">
      {user?.groups.map((group, i) => (
        <CredddBadge group={group} key={i}></CredddBadge>
      ))}
      <Link href="/search">Add creddd</Link>
    </div>
  );
};

export default function AccountPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center">
        <Loader2 className="animate-spin w-4 h-4"></Loader2>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-[30px] justify-start items-center h-[90vh] px-4">
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
      <AddedCredddList user={user}></AddedCredddList>
    </div>
  );
}
