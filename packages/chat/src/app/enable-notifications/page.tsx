'use client';
import { Button } from '@/components/ui/button';
import useRegisterNotificationToken from '@/hooks/useRegisterNotificationToken';
import useSignedInUser from '@/hooks/useSignedInUser';
import {
  isNotificationConfigured,
  setNotificationConfigured,
} from '@/lib/notification';
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
      await registerNotification({
        userId: signedInUser.id,
      });

      router.replace('/');
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
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <Button onClick={onEnableNotificationsClick}>
        {isRegistering ? (
          <Loader2
            className="mr-2 animate-spin"
            size={16}
            color="#000000"
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
