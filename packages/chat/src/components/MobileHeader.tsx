'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClickableBox from './ClickableBox';

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
  headerRight?: React.ReactNode;
}

const MobileHeader = (props: MobileHeaderProps) => {
  const { headerRight, title, showBackButton, backTo } = props;
  const router = useRouter();

  return (
    <div className="px-4 flex flex-row justify-between items-center h-[60px] w-full bg-background border-b-2">
      <div
        onClick={() => {
          if (backTo) {
            router.replace(backTo);
          } else {
            router.back();
          }
        }}
      >
        {(showBackButton && window.history.length > 1) || backTo ? (
          <ClickableBox>
            <ChevronLeft />
          </ClickableBox>
        ) : (
          <></>
        )}
      </div>
      <div>{title}</div>
      <div className="font-bold text-lg">
        {headerRight ? headerRight : <></>}
      </div>
    </div>
  );
};

export default MobileHeader;
