'use client';
import Image from 'next/image';
import Link from 'next/link';

const DesktopFooter = () => {
  return (
    <Link href="https://personaelabs.xyz" target="_blank">
      <div className="hidden md:flex w-full fixed bottom-0 flex-row h-16 items-center justify-center gap-[15px]">
        <Image
          className="opacity-60"
          src="/personae-logo.svg"
          alt="Personae Logo"
          width={20}
          height={20}
        ></Image>
        <div className="italic opacity-60 underline">Made by Personae</div>
      </div>
    </Link>
  );
};

export default DesktopFooter;
