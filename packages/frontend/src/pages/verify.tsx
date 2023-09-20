import { MainButton } from '@/components/MainButton';
import { useGetProof } from '@/hooks/useGetProof';
import { useVerify } from '@/hooks/useVerify';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import { useCallback, useState } from 'react';
import { Hex } from 'viem';

// Append the "0x" prefix to the string if it doesn't have it
const toPrefixedHex = (str: String): Hex => {
  return (str.startsWith('0x') ? str : '0x' + str) as Hex;
};

export default function VerifyPage() {
  const getProof = useGetProof();
  const { verify, verifying } = useVerify();

  // Hash of the proof to verify
  const [proofHash, setProofHash] = useState<string>('');

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
      // TODO: Render the merkle root and the relevant data
    }
  }, [verify, getProof, proofHash]);

  return (
    <>
      <div className="flex h-full w-full  flex-col justify-center gap-4 px-4 py-3 md:px-0 md:py-6 ">
        <div className="mb-4 flex justify-center">
          <input
            type="text"
            className="border-b-2 bg-transparent"
            placeholder="Proof hash"
            onChange={(e) => {
              setProofHash(e.target.value as Hex);
            }}
            value={proofHash}
          />
        </div>
        <div className="flex  justify-center">
          <MainButton message="Verify" handler={handleVerifyClick}></MainButton>
        </div>
      </div>
    </>
  );
}
