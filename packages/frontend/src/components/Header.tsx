import logo from '../../public/personae.svg';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  const router = useRouter();

  return (
    <div className="w-full bg-gray-50">
      <nav className="flex w-full items-center justify-between px-4 py-4">
        <div className="w-[30px]" onClick={() => router.push('/')}>
          <Image src={logo} alt="logo" />
        </div>
        <ConnectButton
          chainStatus={'none'}
          accountStatus={'address'}
          showBalance={false}
        ></ConnectButton>
      </nav>
    </div>
  );
};
