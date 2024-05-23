'use client';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUser from '@/hooks/useUser';
import { trimAddress } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Hex } from 'viem';

const ConnectedAddressesPage = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({ title: 'Connected Addresses', showBackButton: true });
  }, [setOptions]);

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="flex flex-col w-full items-center">
        {user?.connectedAddresses.map((address, i) => (
          <div
            key={i}
            className="flex flex-row items-center py-4 px-4 text-lg border-b-2"
          >
            <div>{trimAddress(address as Hex, 12)}</div>
          </div>
        ))}
      </div>
      <Link href="/settings/add-address">
        <Button className="mt-4">
          <Plus className="w-4 h-4 mr-2"></Plus> Connect address
        </Button>
      </Link>
    </div>
  );
};

export default ConnectedAddressesPage;
