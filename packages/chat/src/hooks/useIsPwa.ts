import { useEffect, useState } from 'react';

const useIsPwa = () => {
  const [isPwa, setIsPwa] = useState<boolean | null>(null);
  useEffect(() => {
    let displayMode = 'browser tab';
    if (window.matchMedia('(display-mode: standalone)').matches) {
      displayMode = 'standalone';
    }
    setIsPwa(displayMode === 'standalone');
  }, []);

  return isPwa;
};

export default useIsPwa;
