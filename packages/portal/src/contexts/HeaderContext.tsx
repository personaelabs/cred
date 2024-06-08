'use client';
import React, { createContext, useContext, useState } from 'react';

export interface HeaderOptions {
  title: string;
  description?: string;
  showBackButton?: boolean;
  headerRight?: React.ReactNode;
  backTo?: string;
}

/**
 * Context to manage the header options (e.g. title, description, buttons, etc.)
 */
const HeaderContext = createContext<{
  options: HeaderOptions;
  setOptions: React.Dispatch<React.SetStateAction<HeaderOptions>>;
}>({
  options: {
    title: '',
    showBackButton: false,
    headerRight: <></>,
  },
  setOptions: () => {},
});

export const useHeaderOptions = () => {
  return useContext(HeaderContext);
};

export function HeaderContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [options, setOptions] = useState<HeaderOptions>({
    title: '',
    showBackButton: false,
    headerRight: <></>,
  });

  return (
    <HeaderContext.Provider
      value={{
        options,
        setOptions,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
}
