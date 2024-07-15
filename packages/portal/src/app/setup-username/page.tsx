'use client';
import { Input } from '@/components/ui/input';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useSignedInUser from '@/hooks/useSignedInUser';
import { isUsernameAvailable } from '@/lib/username';
import {
  isValidUsername,
  USERNAME_REGEX,
  MIN_USERNAME_LENGTH,
} from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSetUsername from '@/hooks/useSetUsername';
import { useRouter } from 'next/navigation';
import useIsUsernameSet from '@/hooks/useIsUsernameSet';

interface UsernameAvailabilityProps {
  username: string;
  isAvailable: boolean;
  isPending: boolean;
}

const UsernameAvailability = (props: UsernameAvailabilityProps) => {
  const { username, isAvailable, isPending } = props;

  if (isPending) {
    return <Loader2 className="animate-spin text-primary" size={16}></Loader2>;
  }

  if (username === '') {
    return <></>;
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return (
      <div className="text-red-500 text-sm">
        Username must be at least {MIN_USERNAME_LENGTH} characters
      </div>
    );
  }

  if (USERNAME_REGEX.test(username) === false) {
    return (
      <div className="text-red-500 text-sm">
        Username contains invalid characters
      </div>
    );
  }

  return isAvailable ? (
    <div className="text-green-500 text-sm text-left flex h-full flex-row items-center">
      <Check className="w-3 h-3 mr-1"></Check>
      Username is available
    </div>
  ) : (
    <div className="text-red-500 text-sm text-left">
      Username is not available
    </div>
  );
};

const SetupUsernamePage = () => {
  const { data: signedInUser } = useSignedInUser();
  const [username, setUsername] = useState<null | string>(null);
  const { setOptions } = useHeaderOptions();
  const { debouncedValue: debouncedUsername, isPending } = useDebounce(
    username,
    300
  );
  const [usernameAvailable, setUsernameAvailable] = useState<boolean>(true);
  const { mutateAsync: submitUsername, isPending: isSubmittingUsername } =
    useSetUsername();
  const router = useRouter();

  const isUsernameSet = useIsUsernameSet();

  // Redirect if the username is already set
  useEffect(() => {
    if (isUsernameSet === true) {
      router.replace('/enable-notifications');
    }
  }, [isUsernameSet, router]);

  // Hook to set the initial username
  useEffect(() => {
    if (signedInUser) {
      if (signedInUser.farcaster) {
        setUsername(signedInUser.farcaster.username);
      } else if (signedInUser.twitter) {
        setUsername(signedInUser.twitter.username);
      } else if (signedInUser.google) {
        // Use the Google name as the initial username
        setUsername(signedInUser.google.name?.toLowerCase() || '');
      } else {
        throw new Error('User has no linked account');
      }
    }
  }, [signedInUser]);

  // Hook to set the header
  useEffect(() => {
    setOptions({
      title: 'Setup Username',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  // Hook to check if the username is available
  useEffect(() => {
    (async () => {
      if (debouncedUsername) {
        const isAvailable = await isUsernameAvailable(debouncedUsername);
        setUsernameAvailable(isAvailable);
      }
    })();
  }, [debouncedUsername]);

  const onNextClick = useCallback(async () => {
    if (username) {
      router.prefetch('/enable-notifications');
      await submitUsername(username);
      router.replace('/enable-notifications');
    }
  }, [router, submitUsername, username]);

  // Don't render anything until the initial username is set
  if (username === null) {
    return <></>;
  }

  const canGoNext = usernameAvailable && username && isValidUsername(username);

  return (
    <div className="w-full h-full flex-col">
      <div className="h-full flex flex-col items-center justify-center gap-y-1">
        <div className="text-left text-sm text-gray-500">Choose a username</div>
        <div className="w-[62.5%] mt-4">
          <Input
            placeholder="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          ></Input>
          <div className="mt-3 h-[32px] ml-1 flex flex-col justify-start">
            <UsernameAvailability
              username={username}
              isAvailable={usernameAvailable}
              isPending={isPending}
            ></UsernameAvailability>
          </div>
        </div>
        <Button
          disabled={!canGoNext || isSubmittingUsername}
          onClick={onNextClick}
        >
          {isSubmittingUsername ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2"></Loader2>
          ) : (
            <></>
          )}
          Next
        </Button>
      </div>
    </div>
  );
};

export default SetupUsernamePage;
