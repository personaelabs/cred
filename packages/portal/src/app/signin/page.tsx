'use client';
import { useEffect } from 'react';
import useSignIn from '@/hooks/useSignIn';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { Loader2 } from 'lucide-react';
import theme from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSignInMethod } from '@/contexts/SignInMethodContext';

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

const SignIn = () => {
  const {
    mutateAsync: signIn,
    isSigningIn,
    error,
  } = useSignIn({
    redirectToAddRep: false,
  });
  const { setOptions } = useHeaderOptions();
  const { setSignInMethod } = useSignInMethod();

  useEffect(() => {
    // By setting to null, all sign in methods are shown
    setSignInMethod(null);
  }, [setSignInMethod]);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to sign in: ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    setOptions({
      title: 'Sign In',
      showBackButton: true,
      backTo: '/onboarding/1',
      headerRight: null,
    });
  }, [setOptions]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      <div className="w-[62.5%] mt-4 flex flex-col items-center">
        <div className="mt-4">
          <SignInButton
            disabled={false}
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
