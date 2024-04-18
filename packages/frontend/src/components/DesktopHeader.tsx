/* eslint-disable @next/next/no-img-element */
'use client';
import useSignedInUser from '@/hooks/useSignedInUser';
import Link from 'next/link';

const DesktopHeader = () => {
  const { data: user } = useSignedInUser();

  return (
    <div className="hidden md:flex h-[80px] w-[100vw] flex-row justify-between items-center gap-8 px-[20px] md:px-[100px]">
      <div className="flex flex-row items-center gap-8">
        {user ? (
          <Link href="/account">
            <img
              src={user.pfp_url}
              alt="profile image"
              className="w-[40px] h-[40px] rounded-full object-cover"
            ></img>
          </Link>
        ) : (
          <></>
        )}
        <Link href="/search">
          <div>Add creddd</div>
        </Link>
      </div>
      <div className="flex flex-row gap-8">
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/explore">Explore</Link>
        <Link
          href="https://personae-labs.notion.site/Creddd-9cdf710a1cf84a388d8a45bf14ecfd20"
          target="_blank"
        >
          About
        </Link>
      </div>
    </div>
  );
};

export default DesktopHeader;
