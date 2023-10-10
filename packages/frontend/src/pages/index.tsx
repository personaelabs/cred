import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MainButton } from '@/components/MainButton';
import { useProve } from '@/hooks/useProve';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useCallback, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
import SETS from '@/lib/sets';
import { Hex } from 'viem';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [username, setUsername] = useState<string>('');
  // The set to prove membership
  const [selectedSet, setSelectedSet] = useState(SETS[0]);
  const [proving, setProving] = useState(false);

  // Hash of the generate proof
  const [proofHash, setProofHash] = useState<string | undefined>();

  const { signMessageAsync } = useSignMessage();

  const { prove } = useProve();
  const submitProof = useSubmitProof();
  const getMerkleProof = useGetMerkleProof(selectedSet);

  const handleProveClick = useCallback(async () => {
    if (address) {
      // TODO: Add a timestamp to the message being signed?
      const message = username;
      const sig = await signMessageAsync({ message });

      setProving(true);
      // Get the merkle proof from the backend
      const merkleProof = await getMerkleProof(address);

      let proof: Hex;
      let publicInput: Hex;
      // When NEXT_PUBLIC_USE_TEST_PROOF is true, we skip the proving step and use dummy proof.
      // The backend is aware of this dummy proof and will accept it.
      // This is useful for testing the UI.
      if (process.env.NEXT_PUBLIC_USE_TEST_PROOF === 'true') {
        proof = '0x';
        publicInput = '0x';
      } else {
        // Prove!
        const result = await prove(sig, username, merkleProof);
        proof = result.proof;
        publicInput = result.publicInput;
      }

      // Submit the proof to the backend
      const proofHash = await submitProof({ proof, publicInput, message, proofVersion: 'v2' });
      setProofHash(proofHash);
      setProving(false);
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
            message={proving ? 'Proving' : 'Prove'}
            handler={handleProveClick}
            disabled={!isConnected}
            loading={proving}
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
