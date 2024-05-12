'use client';
import { Button } from '@/components/ui/button';
import useRegisterNotificationToken from '@/hooks/useRegisterNotificationToken';
import useSignedInUser from '@/hooks/useSignedInUser';
import {
  isNotificationConfigured,
  requestNotificationToken,
  setNotificationConfigured,
} from '@/lib/notification';
import theme from '@/lib/theme';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

const EnableNotifications = () => {
  const { mutateAsync: registerNotification, isPending: isRegistering } =
    useRegisterNotificationToken();
  const router = useRouter();
  const { data: signedInUser } = useSignedInUser();

  const onEnableNotificationsClick = useCallback(async () => {
    if (signedInUser) {
      const token = await requestNotificationToken();

      if (token) {
        await registerNotification({
          userId: signedInUser.id,
          token,
        });

        router.replace('/');
      } else {
        alert('Failed enable notification');
      }
    }
  }, [registerNotification, router, signedInUser]);

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
      <Button onClick={onEnableNotificationsClick}>
        {isRegistering ? (
          <Loader2
            className="mr-2 animate-spin"
            size={16}
            color={theme.orange}
          ></Loader2>
        ) : (
          <></>
        )}
        Enable notifications
      </Button>
      <Button variant="link" onClick={onSkipClick}>
        Skip
      </Button>
    </div>
  );
};

export default EnableNotifications;
