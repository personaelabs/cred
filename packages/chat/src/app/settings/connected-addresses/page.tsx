'use client';
import Scrollable from '@/components/Scrollable';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useAddressGroups from '@/hooks/useAddressGroups';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUser from '@/hooks/useUser';
import { trimAddress } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Hex } from 'viem';

interface AddressListItemProps {
  address: Hex;
}

const AddressListItem = (props: AddressListItemProps) => {
  const { address } = props;

  const { data: groups } = useAddressGroups(address);

  return (
    <div className="flex flex-col items-start py-4 px-4 text-lg border-b-2">
      <div>{trimAddress(address, 12)}</div>
      <div className="flex flex-col items-start w-full">
        {groups?.map((group, i) => (
          <div key={i} className="opacity-60">
            {group.display_name}
          </div>
        ))}
      </div>
    </div>
  );
};

const ConnectedAddressesPage = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({ title: 'Connected Addresses', showBackButton: true });
  }, [setOptions]);

  return (
    <Scrollable>
      <div className="flex flex-col items-center mt-4">
        <div className="flex flex-col w-full items-center">
          {user?.connectedAddresses.length === 0 ? (
            <div className="text-center opacity-60">No connected address</div>
          ) : (
            <></>
          )}
          <div>
            {user?.connectedAddresses.map((address, i) => (
              <AddressListItem
                key={i}
                address={address as Hex}
              ></AddressListItem>
            ))}
          </div>
        </div>
        <Link href="/settings/add-address">
          <Button className="mt-4">
            <Plus className="w-4 h-4 mr-2"></Plus> Add address
          </Button>
        </Link>
      </div>
    </Scrollable>
  );
};

export default ConnectedAddressesPage;
