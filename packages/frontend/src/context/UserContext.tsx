import { GetUserResponse } from '@/app/api/fc-accounts/[fid]/route';
import { StatusAPIResponse } from '@farcaster/auth-kit';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from 'react';

interface UserContextType {
  user: GetUserResponse | null;
  loginWithFarcaster: (userData: StatusAPIResponse) => void;
  // Response body from SIWF
  siwfResponse: StatusAPIResponse | null;
  logout: () => void;
  isLoggedIn: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GetUserResponse | null>(null);
  const [siwfResponse, setSiwfResponse] = useState<StatusAPIResponse | null>(
    null
  );
  const router = useRouter();

  const fetchUser = async (fid: number) => {
    const result = await fetch(`/api/fc-accounts/${fid}`);
    const data = (await result.json()) as GetUserResponse;

    setUser(data);
  };

  // ALready got a user? Load it up!
  useEffect(() => {
    const fid = localStorage.getItem('fid');
    if (fid) {
      fetchUser(parseInt(fid));
    } else {
      console.log('No fid in local storage');
      router.push('/');
    }

    const siwfResponse = localStorage.getItem('siwfResponse');
    if (siwfResponse) {
      setSiwfResponse(JSON.parse(siwfResponse));
    } else {
      console.log('No SIWF response in local storage');
      router.push('/');
    }
  }, [router]);

  const isLoggedIn = () => {
    return user !== null;
  };

  const loginWithFarcaster = (userData: StatusAPIResponse) => {
    if (userData.fid) {
      setSiwfResponse(userData);
      localStorage.setItem('fid', userData.fid.toString());
      localStorage.setItem('siwfResponse', JSON.stringify(userData));
      fetchUser(userData.fid);
    } else {
      throw new Error(
        'loginWithFarcaster called without an FID in `StatusAPIResponse`.'
      );
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fc');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loginWithFarcaster,
        siwfResponse,
        logout,
        isLoggedIn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
