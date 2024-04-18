/* eslint-disable @next/next/no-img-element */
'use client';
import useSignedInUser from '@/hooks/useSignedInUser';
import Link from 'next/link';

const MobileHeader = () => {
  const { data: user } = useSignedInUser();

  return (
    <div className="md:hidden flex flex-row justify-between h-[80px] w-[100vw] p-[24px]">
      <div>
        {user ? (
          <img
            src={user.pfp_url}
            alt="profile image"
            className="w-[36px] h-[36px] rounded-full object-cover"
          ></img>
        ) : (
          <></>
        )}
      </div>
      <Link
        href="https://personae-labs.notion.site/Creddd-9cdf710a1cf84a388d8a45bf14ecfd20"
        target="_blank"
      >
        About
      </Link>
    </div>
  );
};

export default MobileHeader;
