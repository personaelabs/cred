import { Attribute, AttributeCard } from '@/components/global/AttributeCard';
import { useGetUserProofs } from '@/hooks/useGetUserProofs';
import { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function UserPage() {
  const router = useRouter();

  const getUserProofs = useGetUserProofs();

  const [cardAttributes, setCardAttributes] = useState<Attribute[]>([]);

  const handle = router.query.handle as string;

  useEffect(() => {
    const populateCardAttributes = async (handle: string) => {
      let _cardAttributes: Attribute[] = [];
      _cardAttributes.push({
        label: 'handle',
        type: 'text',
        value: handle,
      });

      const data = await getUserProofs(handle);

      data.forEach((proof: any) => {
        const publicInput = PublicInput.deserialize(
          Buffer.from(proof.publicInput.replace('0x', ''), 'hex'),
        );
        const groupRoot = publicInput.circuitPubInput.merkleRoot;
        const set = ROOT_TO_SET[groupRoot.toString()];

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
  }, [handle, getUserProofs, cardAttributes.length]);

  return (
    <>
      <div className="w-full max-w-sm">
        <AttributeCard attributes={cardAttributes} />
      </div>
    </>
  );
}
