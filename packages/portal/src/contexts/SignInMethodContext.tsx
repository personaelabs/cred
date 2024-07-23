'use client';
import { SignInMethod } from '@/types';
import React, { createContext, useContext, useState } from 'react';

/**
 * Context for managing the sign in method to render.
 * This context is used to show the user's sign in method in the /signin-as page.
 */
const SignInMethodContext = createContext<{
  signInMethod: SignInMethod | null;
  setSignInMethod: (_sheet: SignInMethod) => void;
}>({
  signInMethod: null,
  setSignInMethod: () => {},
});

export const useSignInMethod = () => {
  return useContext(SignInMethodContext);
};

export function SignInMethodContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [signInMethod, setSignInMethod] = useState<SignInMethod | null>(null);

  return (
    <SignInMethodContext.Provider
      value={{
        signInMethod,
        setSignInMethod: (_signInMethod: SignInMethod) => {
          setSignInMethod(_signInMethod);
        },
      }}
    >
      {children}
    </SignInMethodContext.Provider>
  );
}
