'use client';
import Image from 'next/image';
import Link from 'next/link';

const MobileFooter = () => {
  return (
    <div className="md:hidden w-full bg-background fixed bottom-0 flex flex-col">
      <Link href="https://personaelabs.xyz" target="_blank">
        <div className="flex flex-row h-16 items-center justify-center gap-[15px]">
          <Image
            className="opacity-60"
            src="/personae-logo.svg"
            alt="Personae Logo"
            width={15}
            height={15}
          ></Image>
          <div className="italic opacity-60 underline">Made by Personae</div>
        </div>
      </Link>
    </div>
  );
};

export default MobileFooter;
