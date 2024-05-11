'use client';
import { icons } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuItemProps {
  icon: keyof typeof icons;
  onClick: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const Icon = icons[props.icon];
  return <Icon onClick={props.onClick} className="w-6 h-6"></Icon>;
};

interface MobileFooterProps {
  isHidden: boolean;
}

const MobileFooter = (props: MobileFooterProps) => {
  const router = useRouter();
  const { isHidden } = props;

  return (
    <div className="md:hidden h-[70px] w-full bg-background fixed bottom-0 flex flex-col">
      <div className="w-full h-full border-t bg-background">
        <div className="w-full h-full px-10 justify-between items-center inline-flex">
          {!isHidden ? (
            <>
              <MenuItem
                icon="UsersRound"
                onClick={() => {
                  router.push('/');
                }}
              ></MenuItem>
              <MenuItem
                icon="MessageCircleMore"
                onClick={() => {
                  router.push('/rooms');
                }}
              ></MenuItem>
              <MenuItem
                icon="Settings"
                onClick={() => {
                  router.push(`/settings`);
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
