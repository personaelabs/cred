'use client';
import { useEffect } from 'react';
import useSignIn from '@/hooks/useSignIn';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { Loader2 } from 'lucide-react';
import theme from '@/lib/theme';
import { Button } from '@/components/ui/button';

const SignIn = () => {
  const { mutateAsync: signIn, isSigningIn } = useSignIn();
  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Sign In',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      {isSigningIn ? (
        <div className="flex flex-row items-center">
          <Loader2
            className="mr-2 animate-spin"
            size={16}
            color={theme.orange}
          ></Loader2>
          <div>Signing in</div>
        </div>
      ) : (
        <Button
          onClick={() => {
            signIn();
          }}
        >
          Sign in
        </Button>
      )}
    </div>
  );
};

export default SignIn;
