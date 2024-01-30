'use client';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { icons } from 'lucide-react';

interface MenuItemProps {
  icon: keyof typeof icons;
  label: string;
  href: string;
}

const MenuItem = (props: MenuItemProps) => {
  const Icon = icons[props.icon];
  const router = useRouter();

  return (
    <div
      className="w-[120px] flex justify-start items-center gap-3 hover:cursor-pointer"
      onClick={() => {
        router.push(props.href);
      }}
    >
      <Icon className="w-[20px] h-[20px]"></Icon>
      <p className="text-[18px]">{props.label}</p>
    </div>
  );
};

const DesktopSidebar = () => {
  const pathname = usePathname();

  const isHidden = pathname === '/onboarding' || pathname === '/verify';

  return (
    <>
      <div
        className={cn([
          'w-full flex flex-col items-center gap-5',
          {
            hidden: isHidden,
            flex: !isHidden,
          },
        ])}
      >
        <MenuItem icon="PenSquare" label="New Post" href="/"></MenuItem>
        <MenuItem
          icon="CircleUser"
          label="Account"
          href="/add-accounts"
        ></MenuItem>
      </div>
    </>
  );
};

export default DesktopSidebar;
