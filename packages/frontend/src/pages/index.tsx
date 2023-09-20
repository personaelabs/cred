import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MainButton } from '@/components/MainButton';
import { useProve } from '@/hooks/useProve';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useCallback, useState } from 'react';

export default function Home() {
  const { isConnected } = useAccount();
  const [username, setUsername] = useState<string>('');

  const { signMessageAsync } = useSignMessage();

  const { prove, proving } = useProve();
  const submitProof = useSubmitProof();

  const handleProveClick = useCallback(async () => {
    // TODO: Add a timestamp to the message being signed?
    const sig = await signMessageAsync({ message: username });

    // TODO: Get the merkle proof
    const merkleProof = null;
    // @ts-ignore
    // const proof = await prove(sig, message, merkleProof);

    await submitProof({ proof: '0xdeadbeef', publicInput: '0xdeadbeef' });
  }, [username, signMessageAsync, prove, submitProof]);

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
        <div className="mb-4 flex justify-center">
          <input
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            value={username}
            className="border-b-2 bg-transparent"
            type="text"
            placeholder="@username"
          ></input>
        </div>
        <div className="flex  justify-center">
          <MainButton
            handler={handleProveClick}
            message={proving ? 'Proving...' : 'Prove'}
            disabled={isConnected == false}
          ></MainButton>
        </div>
      </div>
    </main>
  );
}
