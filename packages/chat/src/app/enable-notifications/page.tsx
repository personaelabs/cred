'use client';
import { Button } from '@/components/ui/button';
import useRegisterNotificationToken from '@/hooks/useRegisterNotificationToken';
import {
  requestNotificationToken,
  setNotificationConfigured,
} from '@/lib/notification';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

const EnableNotifications = () => {
  const { mutateAsync: registerNotification } = useRegisterNotificationToken();
  const router = useRouter();

  const onEnableNotificationsClick = useCallback(async () => {
    const token = await requestNotificationToken();

    if (token) {
      registerNotification({
        fid: 12783,
        token,
      });
    }
  }, [registerNotification]);

  const onSkipClick = useCallback(() => {
    setNotificationConfigured();
    router.push('/');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <Button onClick={onEnableNotificationsClick}>Enable notifications</Button>
      <Button variant="link" onClick={onSkipClick}>
        Skip
      </Button>
    </div>
  );
};

export default EnableNotifications;
