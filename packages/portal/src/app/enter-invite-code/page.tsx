/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
'use client';
import { Input } from '@/components/ui/input';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useDebounce from '@/hooks/useDebounce';
import { useCallback, useEffect, useState } from 'react';
import useIsInviteCodeValid from '@/hooks/useIsInviteCodeValid';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useSubmitInviteCode from '@/hooks/useSubmitInviteCode';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUser from '@/hooks/useUser';
import useIsInviteCodeSet from '@/hooks/useIsInviteCodeSet';
import { Button } from '@/components/ui/button';

interface CodeValidityIndicatorProps {
  isInviteCodeValid: boolean | undefined;
  isLoading: boolean;
}

const CodeValidityIndicator = (props: CodeValidityIndicatorProps) => {
  const { isInviteCodeValid, isLoading } = props;

  if (isLoading) {
    return (
      <Loader2 className="mr-2 animate-spin text-primary" size={16}></Loader2>
    );
  }

  if (isInviteCodeValid === false) {
    return <div className="text-red-500">Invalid invite code</div>;
  }

  if (isInviteCodeValid === true) {
    return (
      <div className="flex flex-row items-center">
        <Check className="text-green-500 mr-2 w-4 h-4"></Check>
        <div className="text-green-500">Valid invite code</div>
      </div>
    );
  }

  return <></>;
};

const EnterInviteCodePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/enable-notifications');
  }, [router]);

  return <></>;
  /*
  const { setOptions } = useHeaderOptions();
  const { data: signedInUser } = useSignedInUser();
  const router = useRouter();
  const {
    mutate: checkInviteCode,
    isPending: isCheckingValidity,
    data: isInviteCodeValid,
  } = useIsInviteCodeValid();

  const isInviteCodeSet = useIsInviteCodeSet();

  const { data: user } = useUser(signedInUser?.id || null);

  const { mutateAsync: submitInviteCode, isPending: isSubmitting } =
    useSubmitInviteCode();

  const [inviteCode, setInviteCode] = useState<string>('');
  const { debouncedValue: debouncedInviteCode } = useDebounce(inviteCode, 300);

  useEffect(() => {
    setOptions({
      title: 'Enter invite code',
    });
  }, [setOptions]);

  useEffect(() => {
    if (isInviteCodeSet === true) {
      router.push('/enable-notifications');
    }
  }, [isInviteCodeSet, router]);

  useEffect(() => {
    if (debouncedInviteCode) {
      checkInviteCode(debouncedInviteCode);
    }
  }, [debouncedInviteCode, checkInviteCode]);

  const onNextClick = useCallback(async () => {
    if (isInviteCodeValid === true && user) {
      await submitInviteCode(inviteCode);

      if (user.username === '') {
        router.push('/setup-username');
      } else {
        router.push('/enable-notifications');
      }
    }
  }, [inviteCode, isInviteCodeValid, router, submitInviteCode, user]);

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <div className="w-[62.5%]">
        <Input
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          className="border-gray-600"
          placeholder="enter invite code"
        ></Input>

        <div className="mt-4 flex flex-row items-start w-full">
          <CodeValidityIndicator
            isInviteCodeValid={isInviteCodeValid}
            isLoading={isCheckingValidity}
          ></CodeValidityIndicator>
        </div>
        <div className="mt-4">
          {isSubmitting ? (
            <div className="flex flex-row items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary"></Loader2>
              <div className="text-primary">Signing in</div>
            </div>
          ) : (
            <></>
          )}
        </div>
        <div className="w-full text-right">
          <Button
            onClick={onNextClick}
            disabled={!isInviteCodeValid || isSubmitting}
            className="mt-4"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
  */
};

export default EnterInviteCodePage;
