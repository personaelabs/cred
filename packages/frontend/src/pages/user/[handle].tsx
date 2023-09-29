import { Attribute, AttributeCard } from '@/components/global/AttributeCard';
import { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function UserPage() {
  const router = useRouter();

  const [cardAttributes, setCardAttributes] = useState<Attribute[]>([]);

  const handle = router.query.handle as string;

  // NOTE: move to hook once we need to do this logic more than once
  const getUserProofs = async (handle: string): Promise<string[]> => {
    const { data } = await axios.get(`/api/users/${handle}/proofs`);

    return data;
  };

  useEffect(() => {
    if (handle) {
      getUserProofs(handle).then((data) => {
        let _cardAttributes: Attribute[] = [];
        _cardAttributes.push({
          label: 'handle',
          type: 'text',
          value: handle,
        });

        // TODO: calculate actual intersection on the fly
        // for now, (while single badge), just use the first proof
        const firstProof: any = data[0];
        const publicInput = PublicInput.deserialize(
          Buffer.from(firstProof.publicInput.replace('0x', ''), 'hex'),
        );
        const groupRoot = publicInput.circuitPubInput.merkleRoot;
        const set = ROOT_TO_SET[groupRoot.toString()];
        _cardAttributes.push({
          label: 'anonymity set size',
          type: 'text',
          value: SET_METADATA[set].count,
        });

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
      });
    }
  }, [handle]);

  return (
    <>
      <div className="w-full max-w-sm">
        <AttributeCard attributes={cardAttributes} />
      </div>
    </>
  );
}
