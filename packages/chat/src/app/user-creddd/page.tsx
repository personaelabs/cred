'use client';
import Scrollable from '@/components/Scrollable';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUserCreddd from '@/hooks/useUserCreddd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const CredddListItem = ({
  creddd,
}: {
  creddd: {
    id: string;
    displayName: string;
  };
}) => {
  return (
    <div className="border-b-2 px-4 py-2 text-lg w-full">
      {creddd.displayName}
    </div>
  );
};

const UserCreddd = () => {
  const { data: signedInUser } = useSignedInUser();
  const router = useRouter();
  const { data: creddd, isFetching: isFetchingCreddd } = useUserCreddd();

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Creddd',
      showBackButton: true,
    });
  }, [setOptions, router]);

  if (!signedInUser) {
    return <div className="bg-background h-full"></div>;
  }

  return (
    <Scrollable>
      <div>
        <div className="flex flex-col justify-start items-center">
          <div className="flex flex-col items-center gap-4 pt-8 bg-background h-full w-full">
            {creddd?.groups.map(group => (
              <CredddListItem key={group.id} creddd={group}></CredddListItem>
            ))}
          </div>
          {!isFetchingCreddd && creddd?.groups.length === 0 ? (
            <div className="opacity-60">No creddd found</div>
          ) : (
            <></>
          )}
          <Button
            className="mt-10"
            onClick={() => {
              router.push('/add-creddd');
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </Scrollable>
  );
};

export default UserCreddd;
