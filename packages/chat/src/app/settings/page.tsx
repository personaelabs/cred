'use client';
import { ChevronRight } from 'lucide-react';
import AvatarWithFallback from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useSignOut from '@/hooks/useSignOut';
/* eslint-disable @next/next/no-img-element */
import useSignedInUser from '@/hooks/useSignedInUser';
import useUsers from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import Scrollable from '@/components/Scrollable';
import { icons } from 'lucide-react';
import theme from '@/lib/theme';

interface SettingsMenuItemProps {
  icon: keyof typeof icons;
  iconColor: string;
  text: string;
  to: string;
}

const SettingsMenuItem = (props: SettingsMenuItemProps) => {
  const Icon = icons[props.icon];
  const { text, to, iconColor } = props;
  return (
    <Link href={to} className="no-underline w-[50%]">
      <div className="w-full flex flex-row items-center justify-between border-2 border-opacity-50 py-1  border-gray-200 rounded-md">
        <div className="flex flex-row  items-center">
          <Icon className="w-5 h-5 ml-2" color={iconColor}></Icon>
          <div className="ml-2 text-lg">{text}</div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-50 mr-2"></ChevronRight>
      </div>
    </Link>
  );
};

const Settings = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: signOut } = useSignOut();
  const router = useRouter();

  const { data: users } = useUsers(signedInUser?.id ? [signedInUser.id] : []);
  const user = users.length > 0 ? users[0] : null;

  const onSignOutClick = useCallback(async () => {
    const confirmed = await window.confirm('Sign out?');
    if (confirmed) {
      await signOut();
      router.push('/signin');
    }
  }, [signOut, router]);

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Settings',
      showBackButton: false,
    });
  }, [setOptions]);

  if (!signedInUser || !user) {
    return <div className="bg-background h-full"></div>;
  }

  return (
    <Scrollable>
      <div className="flex flex-col items-center pt-8 bg-background h-full w-full">
        <div className="flex flex-col items-center gap-4">
          <AvatarWithFallback
            imageUrl={user.pfpUrl}
            size={60}
            alt="profile image"
            name={user.displayName}
          ></AvatarWithFallback>
          <div className="text-2xl font-bold">{user.displayName}</div>
        </div>
        <div className="flex flex-col items-center mt-10 w-full gap-y-2">
          <SettingsMenuItem
            icon="Squircle"
            text="My creddd"
            to="/user-creddd"
            iconColor={theme.orange}
          ></SettingsMenuItem>
          <SettingsMenuItem
            icon="Wallet"
            text="Wallet"
            to="/settings/wallet"
            iconColor="#65a7f7"
          ></SettingsMenuItem>
          <Button variant="link">Enable notifications</Button>
        </div>
        <Button variant="link" className="mt-10" onClick={onSignOutClick}>
          Sign out
        </Button>
      </div>
    </Scrollable>
  );
};

export default Settings;
