import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SET_METADATA } from '@/lib/sets';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useCircuit } from '@/hooks/useCircuit';
import { getSignedInAddress, getVerifiedAddresses } from '@/lib/utils';

const AddCredPage = () => {
  const router = useRouter();
  const { proveV4, proving } = useCircuit();

  const handleAddClick = async () => {
    const address = getSignedInAddress();
    if (!address) {
      throw new Error('No address signed in');
    }

    const verifiedAddresses = getVerifiedAddresses();
    // proveV4(address.sig);
    // Check if the connected address is the singed in address
    // Find the signature stored in local storage
  };

  return (
    <div className="mt-8 w-[450px]">
      <div className="flex justify-center">
        <h2 className="text-2xl font-bold">Add cred</h2>
      </div>
      <Button
        variant="link"
        onClick={() => {
          router.push('/');
        }}
      >
        <ArrowLeft className="mr-2" size={16} />
        My cred
      </Button>
      <div className="mt-2 max-h-[360px] overflow-y-scroll p-8">
        <p className="py-4 font-semibold">Eligible cred</p>
        {Object.keys(SET_METADATA).map((key, i) => {
          return (
            <div key={i}>
              <div className="align-center flex flex-row items-center justify-between">
                <div>{SET_METADATA[key].displayName}</div>
                <Button onClick={handleAddClick}>Add</Button>
              </div>
              <Separator className="my-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddCredPage;
