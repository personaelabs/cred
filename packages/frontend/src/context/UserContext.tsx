import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from 'react';
import { Hex } from 'viem';

// This is pretty FC oriented, not sue if it needs to be generalized or not.
interface User {
  displayName?: string;
  custody: string;
  fid?: number;
  pfpUrl?: string;
  walletAddresses?: string[];
  signature: Hex;
  nonce: string;
}

interface UserContextType {
  user: User | null;
  userStateInitialized: boolean;
  loginWithFarcaster: (userData: User) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
  addWalletAddress: (address: string) => void;
  removeWalletAddress: (address: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStateInitialized, setUserStateInitialized] = useState(false);

  // ALready got a user? Load it up!
  useEffect(() => {
    const storedUser = localStorage.getItem('fc');
    console.log('stored user', storedUser);
    if (storedUser) {
      console.log('setting user', JSON.parse(storedUser));
      setUser(JSON.parse(storedUser));
    }
    setUserStateInitialized(true); // Want to know when we're done with setup so we can renable the button in the UI.
  }, []);

  const isLoggedIn = () => {
    return user !== null;
  };

  const addWalletAddress = (address: string) => {
    console.log('adding wallet address', address);
    // Don't add if already in here:
    if (user && user.walletAddresses?.includes(address)) {
      return;
    }
    if (user) {
      setUser({
        ...user,
        walletAddresses: [...(user.walletAddresses || []), address],
      });
    }
  };

  const removeWalletAddress = (address: string) => {
    console.log('removing wallet address', address);
    if (user) {
      setUser({
        ...user,
        walletAddresses: user.walletAddresses?.filter(a => a !== address),
      });
    }
  };

  const loginWithFarcaster = (userData: User) => {
    setUser(userData);
    // Only store this core FC info, don't keep the wallets here too:
    localStorage.setItem('fc', JSON.stringify(userData));
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
        logout,
        isLoggedIn,
        addWalletAddress,
        removeWalletAddress,
        userStateInitialized,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
