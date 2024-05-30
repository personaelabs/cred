'use client';
import { Switch } from '@/components/ui/switch';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useDisableNotification from '@/hooks/useDisableNotification';
import useDeviceNotificationToken from '@/hooks/useDeviceNotificationToken';
import useRegisterNotificationToken from '@/hooks/useRegisterNotificationToken';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useCallback, useEffect, useState } from 'react';

const NotificationSettingsPage = () => {
  const { setOptions } = useHeaderOptions();
  const { data: deviceNotificationToken } = useDeviceNotificationToken();
  const { mutate: registerNotificationToken, isPending: isRegistering } =
    useRegisterNotificationToken();
  const { data: signedInUser } = useSignedInUser();
  const { mutate: disableNotification, isPending: isDisabling } =
    useDisableNotification();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<
    null | boolean
  >(null);

  useEffect(() => {
    setOptions({
      title: 'Notifications',
      showBackButton: true,
    });
  }, [setOptions]);

  useEffect(() => {
    if (deviceNotificationToken) {
      setIsNotificationsEnabled(deviceNotificationToken.enabled);
    }
  }, [deviceNotificationToken]);

  const onToggle = useCallback(
    (checked: boolean) => {
      if (window.location.protocol !== 'https:') {
        alert('Notifications are only available on HTTPS');
        return;
      }

      if (signedInUser) {
        setIsNotificationsEnabled(checked);

        if (checked) {
          registerNotificationToken({ userId: signedInUser.id });
        } else {
          disableNotification();
        }
      }
    },
    [
      disableNotification,
      registerNotificationToken,
      signedInUser,
      setIsNotificationsEnabled,
    ]
  );

  if (isNotificationsEnabled === null) {
    return <></>;
  }

  return (
    <div className="fle flex-col w-full h-full justify-center items-center">
      <div className="mt-8 flex flex-row justify-center items-center gap-x-2">
        <Switch
          disabled={isRegistering || isDisabling}
          checked={isNotificationsEnabled}
          onCheckedChange={onToggle}
        ></Switch>
        <div>Notifications</div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
