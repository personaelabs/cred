'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClickableBox from './ClickableBox';

interface MobileHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backTo?: string;
  headerRight?: React.ReactNode;
}

const MobileHeader = (props: MobileHeaderProps) => {
  const { headerRight, title, description, showBackButton, backTo } = props;
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
      <div className="flex flex-col justify-center">
        <div className="text-center">{title}</div>
        <div className="text-sm opacity-60 text-center">{description}</div>
      </div>
      <div className="font-bold text-lg">
        {headerRight ? headerRight : <></>}
      </div>
    </div>
  );
};

export default MobileHeader;
