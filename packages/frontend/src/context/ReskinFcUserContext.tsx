import { FcUserSignInInfo } from '@/app/types';
import { getReskinFcSignInInfo, saveReskinFcSignInInfo } from '@/lib/reskin';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  FC,
  useEffect,
  useCallback,
} from 'react';

interface UserContextType {
  signedInUser: FcUserSignInInfo | null;
  onReskinUserSignIn: (_user: FcUserSignInInfo) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useReskinFcUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a ReskinFcUserProvider');
  }
  return context;
};

interface ReskinFcUserProviderProps {
  children: ReactNode;
}

export const ReskinFcUserProvider: FC<ReskinFcUserProviderProps> = ({
  children,
}) => {
  const [signedInUser, setSignedInUser] = useState<FcUserSignInInfo | null>(
    null
  );

  const router = useRouter();

  // Hook to get the signed in user from localStorage if it exists
  useEffect(() => {
    const _signedInUser = getReskinFcSignInInfo();

    if (_signedInUser) {
      setSignedInUser(_signedInUser);
    }
  }, []);

  // Hook to redirect to the attach page once the user is signed in
  useEffect(() => {
    if (signedInUser) {
      router.push('/reskin/attach');
    }
  }, [router, signedInUser]);

  const onReskinUserSignIn = useCallback((_user: FcUserSignInInfo) => {
    saveReskinFcSignInInfo(_user);
    setSignedInUser(_user);
  }, []);

  return (
    <UserContext.Provider
      value={{
        signedInUser,
        onReskinUserSignIn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
