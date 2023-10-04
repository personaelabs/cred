import { useAccount, usePublicClient, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MainButton } from '@/components/MainButton';
import { useProve } from '@/hooks/useProve';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useCallback, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
import { toPrefixedHex } from '@/lib/utils';
import SETS from '@/lib/sets';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [username, setUsername] = useState<string>('');
  // The set to prove membership
  const [selectedSet, setSelectedSet] = useState(SETS[0]);

  // Hash of the generate proof
  const [proofHash, setProofHash] = useState<string | undefined>();

  const { signMessageAsync } = useSignMessage();

  const { prove, proving } = useProve();
  const submitProof = useSubmitProof();
  const getMerkleProof = useGetMerkleProof(selectedSet);

  const handleProveClick = useCallback(async () => {
    if (address) {
      // TODO: Add a timestamp to the message being signed?
      const message = username;
      const sig = await signMessageAsync({ message });

      // Get the merkle proof from the backend
      const merkleProof = await getMerkleProof(address);

      // Prove!
      const fullProof = await prove(sig, username, merkleProof);

      // Convert the proof and the public input into hex format
      const proof = toPrefixedHex(Buffer.from(fullProof.proof).toString('hex'));
      const publicInput = toPrefixedHex(
        Buffer.from(fullProof.publicInput.serialize()).toString('hex'),
      );

      // Submit the proof to the backend
      const proofHash = await submitProof({ proof, publicInput, message });
      setProofHash(proofHash);
    }
  }, [username, signMessageAsync, prove, submitProof, getMerkleProof, address]);

  return (
    // Copied the <main> and the <div> tag under it from https://github.com/personaelabs/noun-nyms/blob/main/packages/frontend/src/pages/index.tsx
    <main className="flex min-h-screen w-full justify-center bg-gray-50">
      <div className="flex h-full w-full max-w-3xl flex-col gap-4 px-4 py-3 md:px-0 md:py-6 ">
        <div className="mb-16 flex justify-end">
          <ConnectButton
            chainStatus={'none'}
            accountStatus={'address'}
            showBalance={false}
          ></ConnectButton>
        </div>
        <div className="mb-2 flex justify-center">
          <input
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            value={username}
            className="border-b-2 bg-transparent"
            type="text"
            placeholder="username"
          ></input>
        </div>
        <div className="mb-2 flex justify-center">
          <select
            className="border-2 bg-transparent"
            onChange={(e) => {
              setSelectedSet(e.target.value);
            }}
            value={selectedSet}
          >
            {SETS.map((set) => (
              <option key={set} value={set}>
                {set}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2 flex justify-center">
          <MainButton
            handler={handleProveClick}
            message={proving ? 'Proving...' : 'Prove'}
            disabled={isConnected == false}
          ></MainButton>
        </div>
        <div className="flex  justify-center">
          {proofHash && (
            <div>
              <p>Done! Proof hash: {proofHash}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
