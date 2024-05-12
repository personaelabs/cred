'use client';
import { Button } from '@/components/ui/button';
import useRegisterNotificationToken from '@/hooks/useRegisterNotificationToken';
import {
  isNotificationConfigured,
  requestNotificationToken,
  setNotificationConfigured,
} from '@/lib/notification';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

const EnableNotifications = () => {
  const { mutateAsync: registerNotification } = useRegisterNotificationToken();
  const router = useRouter();

  const onEnableNotificationsClick = useCallback(async () => {
    const token = await requestNotificationToken();

    if (token) {
      registerNotification({
        userId: '12783', // Temporary
        token,
      });
    }
  }, [registerNotification]);

  const onSkipClick = useCallback(() => {
    setNotificationConfigured();
    router.push('/');
  }, [router]);

  useEffect(() => {
    if (isNotificationConfigured()) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-[100%]">
      <Button onClick={onEnableNotificationsClick}>Enable notifications</Button>
      <Button variant="link" onClick={onSkipClick}>
        Skip
      </Button>
    </div>
  );
};

export default EnableNotifications;
