import { getVerifiedAddresses } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Hex } from 'viem';

// Return the verified addresses that are stored in local storage
export const useVerifiedAddresses = () => {
  const [verifiedAddresses, setVerifiedAddresses] = useState<Hex[] | null>(null);
  useEffect(() => {
    if (verifiedAddresses === null) {
      const addresses = getVerifiedAddresses();
      setVerifiedAddresses(addresses.map((address) => address.address));
    }
  }, [verifiedAddresses]);

  return { verifiedAddresses, setVerifiedAddresses };
};
