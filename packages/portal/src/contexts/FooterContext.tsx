'use client';
import React, { createContext, useContext, useRef } from 'react';

const FooterContext = createContext<{
  /**
   * The ref of the scrollable container of the current screen.
   * This is used to scroll to the top when the footer menu is clicked.
   */
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
