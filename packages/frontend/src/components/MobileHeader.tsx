'use client';
import Image from 'next/image';
import Link from 'next/link';

const MobileHeader = () => {
  return (
    <div className="md:hidden h-[80px] w-[100vw] p-[24px]">
      <Link href="https://personaelabs.xyz" target="_blank">
        <Image
          className="opacity-60"
          src="/personae-logo.svg"
          alt="Personae Logo"
          width={20}
          height={20}
        />
      </Link>
    </div>
  );
};

export default MobileHeader;
