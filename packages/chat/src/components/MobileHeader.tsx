'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  headerRight?: React.ReactNode;
}

const MobileHeader = (props: MobileHeaderProps) => {
  const { headerRight, title, showBackButton } = props;
  const router = useRouter();
  return (
    <div className="md:hidden px-4 flex flex-row justify-between items-center h-[60px] w-[100vw] bg-background border-b-2">
      <div
        onClick={() => {
          router.back();
        }}
      >
        {showBackButton && window.history.length > 1 ? <ChevronLeft /> : <></>}
      </div>
      <div>{title}</div>
      <div className="font-bold text-lg">
        {headerRight ? headerRight : <></>}
      </div>
    </div>
  );
};

export default MobileHeader;
