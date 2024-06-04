'use client';
import { Switch } from '@/components/ui/switch';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useDisableNotification from '@/hooks/useDisableNotification';
import useRegisterNotificationToken from '@/hooks/useRegisterNotificationToken';
import useSignedInUser from '@/hooks/useSignedInUser';
import { isNotificationsEnabled } from '@/lib/notification';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const NotificationSettingsPage = () => {
  const { setOptions } = useHeaderOptions();

  const { mutateAsync: registerNotificationToken, isPending: isRegistering } =
    useRegisterNotificationToken();

  const { data: signedInUser } = useSignedInUser();

  const { mutateAsync: disableNotification, isPending: isDisabling } =
    useDisableNotification();

  const [notificationsEnabled, setNotificationsEnabled] = useState<
    null | boolean
  >(null);

  useEffect(() => {
    setOptions({
      title: 'Notifications',
      showBackButton: true,
    });
  }, [setOptions]);

  useEffect(() => {
    setNotificationsEnabled(isNotificationsEnabled());
  }, []);

  const onToggle = useCallback(
    async (checked: boolean) => {
      if (window.location.protocol !== 'https:') {
        alert('Notifications are only available on HTTPS');
        return;
      }

      if (signedInUser) {
        setNotificationsEnabled(checked);

        if (checked) {
          const registerPromise = registerNotificationToken({
            userId: signedInUser.id,
          });

          toast.promise(registerPromise, {
            loading: 'Enabling notifications...',
            success: 'Notifications enabled',
            error: 'Failed to enable notifications',
            position: 'top-right',
          });
        } else {
          const disablePromise = disableNotification();

          toast.promise(disablePromise, {
            loading: 'Disabling notifications...',
            success: 'Notifications disabled',
            error: 'Failed to disable notifications',
            position: 'top-right',
          });
        }
      }
    },
    [
      disableNotification,
      registerNotificationToken,
      signedInUser,
      setNotificationsEnabled,
    ]
  );

  if (notificationsEnabled === null) {
    return <></>;
  }

  return (
    <div className="fle flex-col w-full h-full justify-center items-center">
      <div className="mt-8 flex flex-row justify-center items-center gap-x-2">
        <Switch
          disabled={isRegistering || isDisabling}
          checked={notificationsEnabled}
          onCheckedChange={onToggle}
        ></Switch>
        <div>Notifications</div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
