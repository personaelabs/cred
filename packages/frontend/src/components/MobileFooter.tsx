'use client';
import { icons } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface MenuItemProps {
  icon: keyof typeof icons;
  onClick: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const Icon = icons[props.icon];
  return <Icon onClick={props.onClick} className="w-6 h-6"></Icon>;
};

const MobileFooter = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show "Made by Personae" on the verification page as it breaks the layout.
  const isHidden = pathname.includes('/verify');

  return (
    <div className="md:hidden w-full bg-background fixed bottom-0 flex flex-col">
      <Link href="https://personaelabs.xyz" target="_blank">
        {isHidden ? (
          <></>
        ) : (
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
        )}
      </Link>
      <div className="w-full border-t bg-background py-6">
        <div className="w-full px-10 justify-between items-start inline-flex">
          <MenuItem
            icon="PenSquare"
            onClick={() => {
              router.push('/');
            }}
          ></MenuItem>
          <MenuItem
            icon="ListTree"
            onClick={() => {
              router.push('/posts');
            }}
          ></MenuItem>
          <MenuItem
            icon="CircleUser"
            onClick={() => {
              router.push(`/add-accounts`);
            }}
          ></MenuItem>
        </div>
      </div>
    </div>
  );
};

export default MobileFooter;
