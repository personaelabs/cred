import { getSignedInAddress } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Hex } from 'viem';

// Return the signed in address that's stored in local storage
export const useSignedInAddress = () => {
  const [signedInAddress, setSignedInAddress] = useState<null | Hex>(null);
  useEffect(() => {
    if (signedInAddress === null) {
      const address = getSignedInAddress();
      if (address) {
        setSignedInAddress(address.address);
      }
    }
  }, [signedInAddress, setSignedInAddress]);

  return { signedInAddress };
};
