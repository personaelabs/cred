'use client';
import React, { createContext, useContext, useRef } from 'react';

const FooterContext = createContext<{
  scrollableRef: React.RefObject<HTMLDivElement> | null;
}>({
  scrollableRef: null,
});

export const useScrollableRef = () => {
  return useContext(FooterContext);
};

export function FooterContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollableRef = useRef(null);

  return (
    <FooterContext.Provider
      value={{
        scrollableRef,
      }}
    >
      {children}
    </FooterContext.Provider>
  );
}
