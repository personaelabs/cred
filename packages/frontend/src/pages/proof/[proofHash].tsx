import { MainButton } from '@/components/MainButton';
import { Attribute, AttributeCard } from '@/components/global/AttributeCard';
import { useGetProof } from '@/hooks/useGetProof';
import { useCircuit } from '@/hooks/useCircuit';
import { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
import { toPrefixedHex } from '@/lib/utils';
import { MembershipProof } from '@prisma/client';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { Hex, hashMessage } from 'viem';

export default function ProofPage() {
  const getProof = useGetProof();
  const { verify, getMsgHash } = useCircuit();

  const [verified, setVerified] = useState<boolean | undefined>();
  const [verifying, setVerifying] = useState<boolean>(false);

  const [proof, setProof] = useState<MembershipProof | undefined>();

  const [proofAttributes, setProofAttributes] = useState<Attribute[]>([]);

  const router = useRouter();

  useEffect(() => {
    // NOTE: temporary while working on the UI
    if (router.query.proofHash) {
      const proofHash = router.query.proofHash as string;
      if (!proof) {
        getProof(toPrefixedHex(proofHash)).then((proof) => {
          setProof(proof);
          // We use the `PublicInput` class from spartan-ecdsa to deserialize the public input.

          // Convert Merkle root in hex to BigInt
          const root = BigInt(proof.merkleRoot || 0).toString(10);
          const metadata = SET_METADATA[ROOT_TO_SET[root]];

          // NOTE: order matters
          setProofAttributes([
            {
              label: 'handle',
              type: 'text',
              value: proof.message,
            },
            {
              label: 'proof description',
              type: 'text',

              value: metadata?.description,
            },
            {
              label: 'set count',
              type: 'text',
              value: metadata?.count,
            },
            {
              label: 'dune query',
              type: 'url',
              value: metadata?.duneURL,
            },
            {
              label: 'proof',
              type: 'url',
              value: `${window.location.origin}/api/proofs/${proofHash}`,
            },
          ]);
        });
      }
    }
  }, [router.query.proofHash, getProof, proof]);

  const handleVerifyClick = useCallback(async () => {
    if (proof) {
      try {
        // Verify the proof
        setVerifying(true);
        let proofVerified = await verify(proof);

        if (proof.proofVersion === 'v3') {
          // We need to check that the message hashes to the msgHash in the public input
          // for the v3 proofs
          const msgHash = await getMsgHash(proof);

          // Check that the message hashes to the msgHash in the public input
          proofVerified = hashMessage(proof.message, 'hex') === msgHash;
        }

        setVerifying(false);
        setVerified(proofVerified);
      } catch (_err) {
        console.error(_err);
        setVerified(false);
      }
    }
  }, [proof, verify, getMsgHash]);

  return (
    <>
      <div className="w-full max-w-sm bg-gray-50">
        <AttributeCard attributes={proofAttributes} />
        <div className="flex  justify-center">
          <MainButton
            message={verified ? 'Verified!' : verifying ? 'Verifying' : 'Verify'}
            loading={verifying}
            handler={handleVerifyClick}
          ></MainButton>
        </div>
        <div className="flex  justify-center">
          {verified === false ? <p>Verification failed!</p> : <> </>}
        </div>
      </div>
    </>
  );
}
