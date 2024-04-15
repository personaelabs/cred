/* eslint-disable @next/next/no-img-element */
'use client';
import useUser from '@/hooks/useUser';
import { Check, Info } from 'lucide-react';
import CREDDD_1_USERS from '@/lib/creddd1Users';
import { getCredddDescription } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GroupSelect } from '@/app/api/fc-accounts/[fid]/route';
import Image from 'next/image';
import Link from 'next/link';

interface CredddBadgeProps {
  group: GroupSelect;
}

const CredddBadge = (props: CredddBadgeProps) => {
  const { group } = props;

  const credddDescription = getCredddDescription(
    group.displayName,
    group.typeId
  );

  return (
    <div className="flex flex-row items-center">
      <Check className="w-4 h-4 mr-2" color="#FDA174"></Check>
      <div>{group.displayName}</div>
      {credddDescription ? (
        <Tooltip delayDuration={200}>
          <TooltipTrigger>
            <Info className="w-4 h-4 ml-2"></Info>
          </TooltipTrigger>
          <TooltipContent>{credddDescription}</TooltipContent>
        </Tooltip>
      ) : (
        <></>
      )}
    </div>
  );
};

const UserPage = ({ params: { fid } }: { params: { fid: string } }) => {
  const user = useUser(fid);

  // If the user is a creddd 1.0 user, render a slightly different UI
  if (CREDDD_1_USERS[fid]) {
    const username = fid;
    const userCreddd = CREDDD_1_USERS[fid];
    return (
      <div className="flex flex-col items-center gap-y-[30px]">
        <div className="text-xl">{username}</div>
        <div className="ml-2 flex flex-col gap-y-[10px]">
          {userCreddd.map((creddd, i) => (
            <div key={i} className="flex flex-row items-center">
              <Check className="w-4 h-4 mr-2" color="#FDA174"></Check>
              <div>{creddd}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-y-[20px]">
      <img
        src={user.pfp_url}
        alt="profile image"
        className="w-[60px] h-[60px] rounded-full object-cover"
      ></img>
      <div className="flex flex-col gap-y-[12px] items-center">
        <div className="flex flex-row items-center gap-x-[8px]">
          {user.display_name}
          <Link href={`https://warpcast.com/${user.username}`} target="href">
            <Image src="/warpcast.svg" alt="warpcast" width={20} height={20} />
          </Link>
        </div>
        <div className="opacity-50">CREDDD SCORE: {user.score}</div>
      </div>
      <div className="ml-2 flex flex-col gap-y-[10px]">
        {user.groups.map((group, i) => (
          <CredddBadge key={i} group={group}></CredddBadge>
        ))}
        {user.groups.length === 0 ? (
          <div className="text-sm text-gray-500 opacity-80">
            No creddd found
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default UserPage;
