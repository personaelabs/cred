/* eslint-disable @next/next/no-img-element */
'use client';
import { ChevronRight } from 'lucide-react';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useSignOut from '@/hooks/useSignOut';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import Scrollable from '@/components/Scrollable';
import { icons } from 'lucide-react';
import theme from '@/lib/theme';
import ClickableBox from '@/components/ClickableBox';
import useUser from '@/hooks/useUser';

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
    <Link href={to} className="no-underline w-[50%] md:w-[200px]">
      <ClickableBox className="w-full flex flex-row items-center justify-between border-2 border-opacity-50 py-1  border-gray-200 rounded-md">
        <div className="flex flex-row  items-center">
          <Icon className="w-5 h-5 ml-2" color={iconColor}></Icon>
          <div className="ml-2 text-lg">{text}</div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-50 mr-2"></ChevronRight>
      </ClickableBox>
    </Link>
  );
};

/**
 * Settings page
 */
const Settings = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: signOut } = useSignOut();
  const router = useRouter();

  const { data: user } = useUser(signedInUser?.id || null);

  const onSignOutClick = useCallback(async () => {
    const confirmed = await window.confirm('Sign out?');
    if (confirmed) {
      router.prefetch('/signin');
      await signOut();
      router.replace('/signin');
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
          <div className="flex flex-col items-center w-full">
            <div className="text-2xl font-bold">{user.displayName}</div>
            <div className="text-md opacity-60">@{user.username}</div>
          </div>
        </div>
        <div className="flex flex-col items-center mt-10 w-full gap-y-2">
          <SettingsMenuItem
            icon="Link2"
            text="My rep"
            to="/settings/creddd"
            iconColor={theme.orange}
          ></SettingsMenuItem>
          <SettingsMenuItem
            icon="Wallet"
            text="Wallet"
            to="/settings/wallet"
            iconColor="#65a7f7"
          ></SettingsMenuItem>
          <SettingsMenuItem
            icon="Bell"
            text="Notifications"
            to="/settings/notification"
            iconColor="#65f7b5"
          ></SettingsMenuItem>
          <SettingsMenuItem
            icon="Users"
            text="Invite"
            to="/settings/invite"
            iconColor="#65a7f7"
          ></SettingsMenuItem>
        </div>
        <Button variant="link" className="mt-10" onClick={onSignOutClick}>
          Sign out
        </Button>
      </div>
      <div className="w-full text-center opacity-40 select-text mb-1">
        user: {user.id}
      </div>
    </Scrollable>
  );
};

export default Settings;
