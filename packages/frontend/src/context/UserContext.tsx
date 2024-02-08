import { createContext, useContext, useState, ReactNode, FC } from 'react';

// This is pretty FC oriented, not sue if it needs to be generalized or not.
interface User {
  displayName?: string;
  custody: string;
  fid?: number;
  pfpUrl?: string;
  walletAddresses?: string[];
}

interface UserContextType {
  user: User | null;
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

  const isLoggedIn = () => {
    return user !== null;
  }

  const addWalletAddress = (address: string) => {
    console.log('adding wallet address', address);
    // Don't add if already in here:
    if (user && user.walletAddresses?.includes(address)) {
      return;
    }
    if (user) {
      setUser({ ...user, walletAddresses: [...(user.walletAddresses || []), address] });
    }
  }

  const removeWalletAddress = (address: string) => {
    console.log('removing wallet address', address);
    if (user) {
      setUser({ ...user, walletAddresses: user.walletAddresses?.filter((a) => a !== address) });
    }
  }

  const loginWithFarcaster = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loginWithFarcaster, logout, isLoggedIn, addWalletAddress, removeWalletAddress }}>
      {children}
    </UserContext.Provider>
  );
};
