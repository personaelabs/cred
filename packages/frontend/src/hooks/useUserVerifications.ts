import { useCallback, useEffect, useState } from 'react';

const useUserVerifications = () => {
  const [verifications, setVerifications] = useState([]);
  const fetchVerifications = useCallback(async () => {}, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  return {
    fetchVerifications,
    verifications,
  };
};

export default useUserVerifications;
