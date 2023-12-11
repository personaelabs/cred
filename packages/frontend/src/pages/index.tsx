import { useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import SETS, { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useGetUserProofs } from '@/hooks/useGetUserProofs';
import { useRouter } from 'next/router';
import { BounceLoader } from 'react-spinners';

// Number of Merkle proofs that can be proven at once
const NUM_MERKLE_PROOFS = 4;

// Get all addresses of the sets
const getSets = async () => {
  const addresses = await Promise.all(
    SETS.map(async (set) => {
      const { data }: { data: string[] } = await axios.get(`/${set}.addresses.json`);
      return { set, addresses: data };
    }),
  );

  return addresses;
};

export default function Home() {
  const router = useRouter();

  const { userProofs, getUserProofs } = useGetUserProofs();

  useEffect(() => {
    getUserProofs('test');
  }, [getUserProofs]);

  if (!userProofs) {
    return (
      <div className="mt-16">
        <BounceLoader size={24}></BounceLoader>
      </div>
    );
  }

  const userCred = userProofs.flatMap((proof) => proof.merkleRoot!.split(','));

  return (
    <div className="align-center mt-8 flex flex-col">
      <div className="flex justify-center">
        <h2 className="text-2xl font-bold">My cred</h2>
      </div>
      <div className="mt-8 flex w-[350px] flex-col items-center">
        {userCred.map((merkleRoot, i) => {
          const set = SET_METADATA[ROOT_TO_SET[BigInt(merkleRoot).toString(10)]];
          return (
            <div key={i} className="w-full">
              <div>{set?.displayName}</div>
              <Separator className="my-2"></Separator>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center">
        <Button
          onClick={() => {
            router.push('/add-cred');
          }}
        >
          <Plus className="mr-2 h-4 w-4"></Plus>
          Add more cred
        </Button>
      </div>
    </div>
  );
}
