'use client';
import '@farcaster/auth-kit/styles.css';
import { SignInButton } from '@farcaster/auth-kit';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import firebaseApp from '@/lib/firebase';
import useSignIn from '@/hooks/useSignIn';

const SignIn = () => {
  const router = useRouter();

  const { signIn } = useSignIn();

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    onAuthStateChanged(auth, user => {
      if (user) {
        router.push('/');
      }
    });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-[100%] bg-background">
      <SignInButton
        onSuccess={async statusApiResponse => {
          await signIn(statusApiResponse);
          router.push('/');
        }}
      />
    </div>
  );
};

export default SignIn;
