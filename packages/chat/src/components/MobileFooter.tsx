'use client';
import { useScrollableRef } from '@/contexts/FooterContext';
import { icons } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface MenuItemProps {
  icon: keyof typeof icons;
  onClick: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const Icon = icons[props.icon];
  return (
    <div
      className="flex justify-center w-full items-center"
      onClick={props.onClick}
    >
      <Icon className="w-6 h-6"></Icon>
    </div>
  );
};

interface MobileFooterProps {
  isHidden: boolean;
}

const MobileFooter = (props: MobileFooterProps) => {
  const router = useRouter();
  const { isHidden } = props;
  const pathname = usePathname();
  const { scrollableRef } = useScrollableRef();

  const onClickMenuItem = (path: string) => {
    if (path === pathname) {
      if (scrollableRef?.current) {
        scrollableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      router.replace(path);
    }
  };

  return (
    <div className="md:hidden h-[70px] w-full bg-background fixed bottom-0 flex flex-col">
      <div className="w-full h-full border-t bg-background">
        <div className="w-full h-full px-2 justify-between items-center inline-flex">
          {!isHidden ? (
            <>
              <MenuItem
                icon="UserRoundSearch"
                onClick={() => {
                  onClickMenuItem('/');
                }}
              ></MenuItem>
              <MenuItem
                icon="MessageCircleMore"
                onClick={() => {
                  onClickMenuItem('/rooms');
                }}
              ></MenuItem>
              <MenuItem
                icon="Settings"
                onClick={() => {
                  onClickMenuItem('/settings');
                }}
              ></MenuItem>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFooter;
