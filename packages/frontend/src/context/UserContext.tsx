import { GetUserResponse } from '@/app/api/fc-accounts/[fid]/route';
import { StatusAPIResponse } from '@farcaster/auth-kit';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
  useCallback,
} from 'react';

interface UserContextType {
  user: GetUserResponse | null;
  loginWithFarcaster: (_userData: StatusAPIResponse) => void;
  // Response body from SIWF
  siwfResponse: StatusAPIResponse | null;
  logout: () => void;
  isLoggedIn: () => boolean;
  refetchUser: () => void;
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
  const pathname = usePathname();

  const fetchUser = async (fid: number) => {
    const result = await fetch(`/api/fc-accounts/${fid}`);
    const data = (await result.json()) as GetUserResponse;

    setUser(data);
  };

  const refetchUser = useCallback(() => {
    if (user) {
      fetchUser(user.fid);
    }
  }, [user]);

  useEffect(() => {
    const isUserProfilePage = /\/user\//.test(pathname);

    // Check login status if this is not a user profile page
    if (!isUserProfilePage) {
      const fid = localStorage.getItem('fid');
      if (fid) {
        fetchUser(parseInt(fid));
      } else {
        // If there's no FID in local storage, redirect to the login page
        console.log('No fid in local storage');
        router.push('/');
      }

      const siwfResponse = localStorage.getItem('siwfResponse');
      if (siwfResponse) {
        setSiwfResponse(JSON.parse(siwfResponse));
      } else {
        // If there's no SIWF response in local storage, redirect to the login page
        console.log('No SIWF response in local storage');
        router.push('/');
      }
    }
  }, [pathname, router]);

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
        refetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
