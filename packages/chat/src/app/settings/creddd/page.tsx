'use client';
import Scrollable from '@/components/Scrollable';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUser from '@/hooks/useUser';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface CredddListItemProps {
  groupId: string;
}

const CredddListItem = (props: CredddListItemProps) => {
  const { groupId } = props;

  return (
    <div className="flex flex-col items-start py-4 px-4 text-lg border-b-2">
      <div>{groupId}</div>
    </div>
  );
};

const CredddPage = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);
  console.log(user);

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({ title: 'Your Creddd', showBackButton: true });
  }, [setOptions]);

  return (
    <Scrollable>
      <div className="flex flex-col items-center mt-4 pb-[64px]">
        <div className="flex flex-col w-full items-center">
          {user?.addedCreddd.length === 0 ? (
            <div className="text-center opacity-60">No creddd</div>
          ) : (
            <></>
          )}
          <div>
            {user?.addedCreddd.map((groupId, i) => (
              <CredddListItem key={i} groupId={groupId}></CredddListItem>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-y-4 items-center">
          <Link href="/settings/add-creddd">
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2"></Plus> Add creddd
            </Button>
          </Link>
        </div>
      </div>
    </Scrollable>
  );
};

export default CredddPage;
