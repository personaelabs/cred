'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ReskinAfterCreatePage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-[24px]">
      <div>Account created</div>
      <Button
        variant="ghost"
        onClick={() => {
          window.open('https://warpcast.com', '_blank');
        }}
      >
        <Image
          className="mr-2"
          src="/warpcast.svg"
          alt="Warpcast"
          width={24}
          height={24}
        ></Image>
        Open Warpcast
      </Button>
      <Button
        variant="link"
        onClick={() => {
          router.push('/reskin');
        }}
      >
        Create another account
      </Button>
    </div>
  );
};

export default ReskinAfterCreatePage;
