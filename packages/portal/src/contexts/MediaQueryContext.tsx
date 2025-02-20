'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const MediaQueryContext = createContext<{
  isMobile: boolean;
}>({
  isMobile: true,
});

export const useMediaQuery = () => {
  return useContext(MediaQueryContext);
};

export function MediaQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 480);

    function handleResize() {
      setIsMobile(window.innerWidth < 480);
    }

    if (typeof window !== 'undefined') {
      handleResize();
    }

    window.addEventListener('resize', handleResize);
    return () => {
      // remove event listener when the component is unmounted to not cause any memory leaks
      // otherwise the event listener will continue to be active
      window.removeEventListener('resize', handleResize);
    };
    // add `isMobile` state variable as a dependency so that
    // it is called every time the window is resized
  }, [isMobile]);

  return (
    <MediaQueryContext.Provider
      value={{
        isMobile,
      }}
    >
      {children}
    </MediaQueryContext.Provider>
  );
}
