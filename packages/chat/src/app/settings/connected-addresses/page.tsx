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
      <div className="flex flex-col items-center mt-4 pb-[64px]">
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
        <div className="flex flex-col gap-y-4 items-center">
          <Link href="/settings/add-address">
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2"></Plus> Add address
            </Button>
          </Link>
          <div className="flex flex-col items-center">
            <div className="opacity-60">Coming soon</div>
            <Button
              disabled
              className="bg-gradient-to-l from-purple-300 to-purple-500"
            >
              <Plus className="w-4 h-4 mr-2"></Plus> Add private address
            </Button>
          </div>
        </div>
      </div>
    </Scrollable>
  );
};

export default ConnectedAddressesPage;
