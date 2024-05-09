/* eslint-disable @next/next/no-img-element */
'use client';

import { usePathname } from 'next/navigation';

const PATHNAME_TO_TITLE: {
  [key: string]: string;
} = {
  '/': 'Home',
  '/rooms': 'Chats',
  '/rooms/[roomId]': 'Chat',
  '/settings': 'Settings',
};

const MobileHeader = () => {
  const pathname = usePathname();

  const title = PATHNAME_TO_TITLE[pathname] || '';

  return (
    <div className="md:hidden flex flex-col items-center justify-center h-[60px] w-[100vw] bg-background border-b-2 bg-background">
      <div className="font-bold text-lg">{title}</div>
    </div>
  );
};

export default MobileHeader;
