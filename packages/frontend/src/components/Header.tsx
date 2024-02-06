'use client';
import { usePathname, useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  const pathname = usePathname();

  const showHeader = pathname !== '/onboarding';

  return showHeader ? (
    <div className="flex flex-row justify-end gap-2 p-4">
      <ConnectButton showBalance={false}></ConnectButton>
    </div>
  ) : (
    <></>
  );
};

export default Header;
