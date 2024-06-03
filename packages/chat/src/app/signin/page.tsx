'use client';
import { useEffect, useState } from 'react';
import useSignIn, { saveInviteCode } from '@/hooks/useSignIn';
import useIsInviteCodeValid from '@/hooks/useIsInviteCodeValid';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { Check, Loader2 } from 'lucide-react';
import theme from '@/lib/theme';
import { Button } from '@/components/ui/button';
import useDebounce from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SignInButtonProps {
  signingIn: boolean;
  disabled: boolean;
  onSignInClick: () => void;
}

const SignInButton = (props: SignInButtonProps) => {
  const { signingIn, disabled, onSignInClick } = props;

  if (signingIn) {
    return (
      <div className="flex flex-row items-center">
        <Loader2
          className="mr-2 animate-spin"
          size={16}
          color={theme.orange}
        ></Loader2>
        <div>Signing in</div>
      </div>
    );
  }

  return (
    <Button
      disabled={disabled || signingIn}
      onClick={() => {
        onSignInClick();
      }}
    >
      Sign in
    </Button>
  );
};

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

const SignIn = () => {
  const [inviteCode, setInviteCode] = useState<string>('');
  const { mutateAsync: signIn, isSigningIn, error } = useSignIn();
  const { setOptions } = useHeaderOptions();
  const {
    mutate: checkInviteCode,
    isPending: isCheckingValidity,
    data: isInviteCodeValid,
  } = useIsInviteCodeValid();

  const { debouncedValue: debouncedInviteCode } = useDebounce(inviteCode, 300);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to sign in: ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    if (debouncedInviteCode) {
      checkInviteCode(debouncedInviteCode);
    }
  }, [debouncedInviteCode, checkInviteCode]);

  useEffect(() => {
    setOptions({
      title: 'Sign In',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  // Save the invite code to local storage if it is valid
  useEffect(() => {
    if (isInviteCodeValid === true) {
      saveInviteCode(inviteCode);
    }
  }, [isInviteCodeValid, inviteCode]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      <div className="w-[62.5%] mt-4 flex flex-col items-center">
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
          <SignInButton
            disabled={isInviteCodeValid !== true}
            signingIn={isSigningIn}
            onSignInClick={async () => {
              await signIn();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
