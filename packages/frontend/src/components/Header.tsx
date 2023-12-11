import logo from '../../public/personae.svg';
import Image from 'next/image';
import { useRouter } from 'next/router';
import HeaderTabs from './HeaderTabs';
import { useSignedInAddress } from '@/hooks/useSignedInAddress';
import { trimAddress } from '@/lib/utils';

export const Header = () => {
  const router = useRouter();
  const { signedInAddress } = useSignedInAddress();

  return (
    <div className="w-full bg-gray-50">
      <nav className="flex w-full items-center justify-between px-4 py-4">
        <div className="w-[30px]" onClick={() => router.push('/')}>
          <Image src={logo} alt="logo" />
        </div>
        {signedInAddress ? <p>{trimAddress(signedInAddress)}</p> : <></>}
      </nav>
      <div className="flex w-full items-center justify-center">
        {router.pathname !== '/signin' ? <HeaderTabs /> : <></>}
      </div>
    </div>
  );
};
