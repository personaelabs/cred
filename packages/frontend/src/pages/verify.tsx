'use client';

import { MainButton } from '@/components/MainButton';
import { useGetProof } from '@/hooks/useGetProof';
import { useVerify } from '@/hooks/useVerify';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import { useCallback, useEffect, useState } from 'react';
import { toPrefixedHex } from '@/lib/utils';
import { ROOT_TO_SET, SET_METADATA, SetMetadata } from '@/lib/sets';

import { useRouter } from 'next/router';
import { FullProof } from '@/types';
import { hashMessage } from 'viem';
import { Attribute, AttributeCard } from '@/components/global/AttributeCard';

export default function VerifyPage() {
  const getProof = useGetProof();
  const { verify, verifying } = useVerify();

  const [verified, setVerified] = useState<boolean | undefined>();
  const [metadata, setMetadata] = useState<SetMetadata>();
  const [handle, setHandle] = useState<string | undefined>();
  const [proofUrl, setProofUrl] = useState<string>('');
  const [proof, setProof] = useState<FullProof | undefined>();
  const [msgHash, setMsgHash] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    // NOTE: temporary while working on the UI
    // if (router.query.proofHash) {
    //   const proofHash = router.query.proofHash as string;
    //   setProofUrl(`${window.location.origin}/api/proofs/${proofHash}`);
    //   if (!proof) {
    //     getProof(toPrefixedHex(proofHash)).then((proof) => {
    //       setProof(proof);
    //       // We use the `PublicInput` class from spartan-ecdsa to deserialize the public input.
    //       const publicInput = PublicInput.deserialize(
    //         Buffer.from(proof.publicInput.replace('0x', ''), 'hex'),
    //       );
    //       // Get the merkle root from the public input
    //       const groupRoot = publicInput.circuitPubInput.merkleRoot;
    //       // msgHash will be used for verifying the proof
    //       setMsgHash(publicInput.msgHash.toString('hex'));
    //       setMetadata(SET_METADATA[ROOT_TO_SET[groupRoot.toString(10)]]);
    //       setHandle(proof.message);
    //     });
    //   }
    // }
  }, [router.query.proofHash, getProof, proof]);

  // NOTE: temporary while iterating on UI
  const attributes: Attribute[] = [
    {
      label: 'handle',
      value: handle,
    },
    {
      label: 'proof description',
      value: metadata?.description,
    },
    {
      label: 'set count',
      value: metadata?.count,
    },
    {
      label: 'dune query',
      value: metadata?.duneURL,
    },
    {
      label: 'proof',
      value: proofUrl,
    },
  ];

  const handleVerifyClick = useCallback(async () => {
    if (proof) {
      try {
        // Verify the proof
        const proofVerified = await verify(proof);

        // Check that the message hashes to the msgHash in the public input
        const msgVerified =
          Buffer.from(hashMessage(proof.message, 'bytes')).toString('hex') === msgHash;

        setVerified(msgVerified && proofVerified);
      } catch (_err) {
        setVerified(false);
      }
    }
  }, [verify, proof, msgHash]);

  return (
    <>
      <div className="w-full max-w-sm">
        <AttributeCard attributes={attributes} />;
        <div className="flex  justify-center">
          <MainButton
            message={verifying ? 'Verifying...' : verified ? 'Verified!' : 'Verify'}
            disabled={verifying || verified}
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
