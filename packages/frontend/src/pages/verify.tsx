import { MainButton } from '@/components/MainButton';
import { useGetProof } from '@/hooks/useGetProof';
import { useVerify } from '@/hooks/useVerify';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import { useCallback } from 'react';
import { toPrefixedHex } from '@/lib/utils';
import { emptyMetadata, handleToProofHash, handleToSet, setMetadata } from '@/lib/sets';

import { useRouter } from 'next/router';

export default function VerifyPage() {
  const getProof = useGetProof();
  const { verify, verifying } = useVerify();

  const router = useRouter();
  const { h } = router.query;

  const set = handleToSet[h as string];
  const metadata = set ? setMetadata[set] : emptyMetadata;

  const proofHash = handleToProofHash[h as string];

  const handleVerifyClick = useCallback(async () => {
    if (proofHash) {
      // Fetch the proof from the backend
      const proof = await getProof(toPrefixedHex(proofHash));
      // Verify the proof
      await verify(proof);
      // We use the `PublicInput` class from spartan-ecdsa to deserialize the public input.
      const publicInput = PublicInput.deserialize(
        Buffer.from(proof.publicInput.replace('0x', ''), 'hex'),
      );
      // Get the merkle root from the public input
      const groupRoot = publicInput.circuitPubInput.merkleRoot;
      // TODO: indicate verification complete + option to download proof
      // TODO: download proof?
    }
  }, [verify, getProof, proofHash]);

  return (
    <>
      {h && set ? (
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
                    value={h}
                    disabled
                  />
                </div>
              </div>

              <div className="mb-6 md:flex md:items-center">
                <div className="md:w-1/3">
                  <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                    set name
                  </label>
                </div>
                <div className="md:w-2/3">
                  <input
                    className="w-full appearance-none rounded border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none"
                    type="text"
                    value={metadata.displayName}
                    disabled
                  />
                </div>
              </div>

              <div className="mb-6 md:flex md:items-center">
                <div className="md:w-1/3">
                  <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                    description
                  </label>
                </div>
                <div className="md:w-2/3">
                  <textarea
                    className="w-full appearance-none rounded border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none"
                    wrap="soft"
                    value={metadata.description}
                    disabled
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
                    value={metadata.count}
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
                  <a href={metadata.duneURL} target="_blank" rel="noreferrer">
                    {metadata.duneURL}
                  </a>
                </div>
              </div>

              <div className="mb-6 md:flex md:items-center">
                <div className="md:w-1/3">
                  <label className="mb-1 block pr-4 font-bold text-gray-500 md:mb-0 md:text-right">
                    proof hash
                  </label>
                </div>
                <div className="md:w-2/3">
                  <input
                    className="w-full appearance-none rounded border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-purple-500 focus:bg-white focus:outline-none"
                    type="text"
                    value={proofHash}
                    disabled
                  />
                </div>
              </div>
            </form>
          </div>
          <div className="flex  justify-center">
            <MainButton message="Verify" handler={handleVerifyClick}></MainButton>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full  flex-col justify-center gap-4 px-4 py-3 md:px-0 md:py-6 ">
          <div className="mb-4 flex justify-center">handle not found</div>
        </div>
      )}
    </>
  );
}
