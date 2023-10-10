import { Attribute, AttributeCard } from '@/components/global/AttributeCard';
import { useGetCombinedAnonSet } from '@/hooks/useGetCombinedAnonSet';
import { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
import { MembershipProof } from '@prisma/client';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function UserPage() {
  const router = useRouter();

  const getCombinedAnonSet = useGetCombinedAnonSet();

  const [cardAttributes, setCardAttributes] = useState<Attribute[]>([]);

  const handle = router.query.handle as string;

  // NOTE: move to hook once we need to do this logic more than once
  const getUserProofs = async (handle: string): Promise<MembershipProof[]> => {
    const { data } = await axios.get(`/api/users/${handle}/proofs`);

    return data;
  };

  useEffect(() => {
    const populateCardAttributes = async (handle: string) => {
      let _cardAttributes: Attribute[] = [];
      _cardAttributes.push({
        label: 'handle',
        type: 'text',
        value: handle,
      });

      const data = await getUserProofs(handle);
      const sets = data.map((proof: MembershipProof) => {
        const groupRoot = BigInt(proof.merkleRoot || 0).toString(10);
        return ROOT_TO_SET[groupRoot];
      });

      // NOTE temporarily remove this indicator as 'union' isn't quite accurate
      // const intersectionCount = await getCombinedAnonSet(sets);
      // _cardAttributes.push({
      //   label: 'anonymity set size',
      //   type: 'text',
      //   value: intersectionCount,
      // });

      data.forEach((proof: MembershipProof) => {
        // TODO: we're computing sets twice... above and here
        const groupRoot = BigInt(proof.merkleRoot || 0).toString(10);
        const set = ROOT_TO_SET[groupRoot];

        _cardAttributes.push({
          label: SET_METADATA[set].displayName,
          type: 'url',
          value: `${window.location.origin}/proof/${proof.proofHash}`,
        });
      });

      setCardAttributes(_cardAttributes);
    };

    if (handle && cardAttributes.length === 0) {
      populateCardAttributes(handle).catch(console.error);
    }
  }, [handle, getCombinedAnonSet, cardAttributes.length]);

  return (
    <>
      <div className="w-full max-w-sm">
        <AttributeCard attributes={cardAttributes} />
      </div>
    </>
  );
}
