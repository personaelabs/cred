'use client';
import { useScrollableRef } from '@/contexts/FooterContext';
import { icons } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ClickableBox from './ClickableBox';

interface MenuItemProps {
  icon: keyof typeof icons;
  path: string;
  onClick: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const Icon = icons[props.icon];
  const router = useRouter();

  useEffect(() => {
    router.prefetch(props.path);
  }, [props.path, router]);

  return (
    <ClickableBox
      className="flex justify-center w-full items-center"
      onClick={props.onClick}
    >
      <Icon className="w-6 h-6"></Icon>
    </ClickableBox>
  );
};

interface FooterNavigationProps {}

const FooterNavigation = (_props: FooterNavigationProps) => {
  const router = useRouter();
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
    <div className="h-[70px] w-full md:w-[50%] bg-background fixed bottom-0 flex flex-col">
      <div className="w-full h-full border-t bg-background">
        <div className="w-full h-full px-2 justify-between items-center inline-flex">
          <MenuItem
            icon="UserRoundSearch"
            onClick={() => {
              onClickMenuItem('/');
            }}
            path="/"
          ></MenuItem>
          <MenuItem
            icon="MessageCircleMore"
            onClick={() => {
              onClickMenuItem('/chats');
            }}
            path="/chats"
          ></MenuItem>
          <MenuItem
            icon="Settings"
            onClick={() => {
              onClickMenuItem('/settings');
            }}
            path="/settings"
          ></MenuItem>
        </div>
      </div>
    </div>
  );
};

export default FooterNavigation;
