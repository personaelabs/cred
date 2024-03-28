'use client';
import Image from 'next/image';
import Link from 'next/link';

const MobileHeader = () => {
  return (
    <div className="md:hidden flex flex-row justify-between h-[80px] w-[100vw] p-[24px]">
      <Link href="https://personaelabs.xyz" target="_blank">
        <Image
          className="opacity-60"
          src="/personae-logo.svg"
          alt="Personae Logo"
          width={20}
          height={20}
        />
      </Link>
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
