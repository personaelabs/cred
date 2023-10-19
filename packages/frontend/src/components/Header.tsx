import logo from '../../public/personae.svg';
import Image from 'next/image';
import { useRouter } from 'next/router';

export const Header = () => {
  const router = useRouter();

  return (
    <div className="w-full bg-gray-50">
      <nav className="flex w-full items-center px-4 py-4">
        <div className="w-[30px]" onClick={() => router.push('/')}>
          <Image src={logo} alt="logo" />
        </div>
      </nav>
    </div>
  );
};
