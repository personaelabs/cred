import { useEffect, useState } from 'react';

const useIsPushNotifySupported = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  return isSupported;
};

export default useIsPushNotifySupported;
