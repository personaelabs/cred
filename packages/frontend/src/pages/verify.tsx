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
    if (router.query.proofHash) {
      const proofHash = router.query.proofHash as string;
      setProofUrl(`${window.location.origin}/api/proofs/${proofHash}`);

      if (!proof) {
        getProof(toPrefixedHex(proofHash)).then((proof) => {
          setProof(proof);

          // We use the `PublicInput` class from spartan-ecdsa to deserialize the public input.
          const publicInput = PublicInput.deserialize(
            Buffer.from(proof.publicInput.replace('0x', ''), 'hex'),
          );
          // Get the merkle root from the public input
          const groupRoot = publicInput.circuitPubInput.merkleRoot;

          // msgHash will be used for verifying the proof
          setMsgHash(publicInput.msgHash.toString('hex'));

          setMetadata(SET_METADATA[ROOT_TO_SET[groupRoot.toString(10)]]);
          setHandle(proof.message);
        });
      }
    }
  }, [router.query.proofHash, getProof, proof]);

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
      <div className="flex h-full w-full  flex-col justify-center gap-4 px-4 py-3 md:px-0 md:py-6 ">
        <div className="mb-4 flex justify-center">
          <form className="w-full max-w-sm">
            <div className="mb-6 md:flex md:items-center">
              <div className="md:w-1/3">
                <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                  handle
                </label>
              </div>
              <div className="md:w-2/3">
                <input
                  className="w-full appearance-none rounded border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none"
                  type="text"
                  value={handle}
                  disabled
                  style={{
                    opacity: 1,
                  }}
                />
              </div>
            </div>

            <div className="mb-6 md:flex md:items-center">
              <div className="md:w-1/3">
                <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                  proof description
                </label>
              </div>
              <div className="md:w-2/3">
                <textarea
                  className="w-full appearance-none rounded border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none"
                  wrap="soft"
                  value={metadata?.description}
                  disabled
                  style={{
                    opacity: 1,
                  }}
                />
              </div>
            </div>

            <div className="mb-6 md:flex md:items-center">
              <div className="md:w-1/3">
                <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                  set count
                </label>
              </div>
              <div className="md:w-2/3">
                <input
                  className="w-full appearance-none rounded border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none"
                  type="text"
                  style={{
                    opacity: 1,
                  }}
                  value={metadata?.count}
                  disabled
                />
              </div>
            </div>

            <div className="mb-6 md:flex md:items-center">
              <div className="md:w-1/3">
                <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                  dune query
                </label>
              </div>
              <div className="md:w-2/3">
                <a href={metadata?.duneURL} target="_blank" rel="noreferrer" className="underline">
                  {metadata?.duneURL}
                </a>
              </div>
            </div>

            <div className="mb-6 md:flex md:items-center">
              <div className="md:w-1/3">
                <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                  proof
                </label>
              </div>
              <div className="md:w-2/3">
                <a href={proofUrl} target="_blank" rel="noreferrer" className="underline">
                  proof URL
                </a>
              </div>
            </div>
          </form>
        </div>
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
