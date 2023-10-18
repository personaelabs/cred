import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useCallback, useEffect, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
import SETS, { SET_METADATA } from '@/lib/sets';
import { Hex } from 'viem';
import { SIG_MESSAGE, getFid } from '@/lib/fc';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FcAvatar } from '@/components/global/FcAvatar';
import { useCircuit } from '@/hooks/useCircuit';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { SubmitData } from '@/types';
import { useFcProfile } from '@/hooks/useFcProfile';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const CheckableButton = (props?: any) => (
  <Button color="#7c65c1" disabled={props?.check || props?.disabled}>
    {props?.check && <Check className="mr-2 h-4 w-4"></Check>}
    {props.children}
  </Button>
);

export default function FcAnon() {
  const { address } = useAccount();

  // The set to prove membership
  const [selectedSet, setSelectedSet] = useState(SETS[0]);
  const [proving, setProving] = useState(false);
  const [fid, setFid] = useState<string | null>(null);

  // Address with credibility
  const [sourceAddress, setSourceAddress] = useState<string | null>(null);

  // Recovery address of the Farcaster account
  const [fcAddress, setFcAddress] = useState<string | null>(null);

  // Hash of the generated proof
  const [proofHash, setProofHash] = useState<string | undefined>();
  const [fcAccountSig, setFcAccountSig] = useState<Hex | null>(null);
  const [sourceAccountSig, setSourceAccountSig] = useState<Hex | null>(null);
  const [fidNotFound, setFidNotFound] = useState<boolean>(false);
  const [searchingFid, setSearchingFid] = useState<boolean>(false);

  const { signMessageAsync } = useSignMessage();

  const { prove } = useCircuit();
  const submitProof = useSubmitProof();
  const getMerkleProof = useGetMerkleProof();
  const { fcProfile, getFcProfile } = useFcProfile();

  // When the FID is found, fetch the profile
  useEffect(() => {
    (async () => {
      if (fid) {
        await getFcProfile(fid);
      }
    })();
  }, [fid, getFcProfile]);

  const sigMessage = SIG_MESSAGE(SET_METADATA[selectedSet].displayName);

  const handleProveClick = useCallback(async () => {
    if (sourceAddress && fid && sourceAccountSig && fcAccountSig) {
      setProving(true);

      // Get the merkle proof from the backend
      const merkleProof = await getMerkleProof(selectedSet, sourceAddress);

      console.log({ merkleProof });

      // Prove!
      let proof: Hex;
      // When NEXT_PUBLIC_USE_TEST_PROOF is true, we skip the proving step and use dummy proof.
      // The backend is aware of this dummy proof and will accept it.
      // This is useful for testing the UI.
      if (process.env.NEXT_PUBLIC_USE_TEST_PROOF === 'true') {
        proof = '0x';
      } else {
        // Prove!
        proof = await prove(fcAccountSig, sourceAccountSig, sigMessage, merkleProof);
      }

      const data: SubmitData = {
        proof,
        message: sigMessage,
        fcAccountSig,
      };

      // Submit the proof to the backend
      const proofHash = await submitProof(data);
      setProofHash(proofHash);
      setProving(false);
    }
  }, [
    sourceAddress,
    fid,
    sourceAccountSig,
    fcAccountSig,
    getMerkleProof,
    selectedSet,
    submitProof,
    prove,
    sigMessage,
  ]);

  const signWithRecoveryAddress = useCallback(async () => {
    if (address) {
      const sig = await signMessageAsync({ message: sigMessage });

      setFcAccountSig(sig);
      setFcAddress(address);

      setSearchingFid(true);
      setFidNotFound(false);
      const _fid = await getFid(address);

      if (_fid) {
        setFid(_fid);
      } else {
        setFidNotFound(true);
      }
      setSearchingFid(false);
    }
  }, [address, sigMessage, signMessageAsync]);

  const signWithSourceAddress = useCallback(async () => {
    if (address) {
      const sig = await signMessageAsync({ message: sigMessage });
      setSourceAddress(address);
      setSourceAccountSig(sig);
    }
  }, [address, sigMessage, signMessageAsync]);

  const readyToProve = fcAccountSig && sourceAccountSig && fid;

  return (
    <main className="flex min-h-screen w-full justify-center bg-gray-50">
      <div className="align-center flex h-full w-full max-w-xl flex-col gap-8 px-4 py-3 md:px-0 md:py-6">
        <div className="mb-16 flex justify-end">
          <ConnectButton
            chainStatus={'none'}
            accountStatus={'address'}
            showBalance={false}
          ></ConnectButton>
        </div>
        <div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger> What’s this?</AccordionTrigger>
              <AccordionContent>
                <p>
                  By linking an Ethereum address that satisfies a condition to your Farcaster
                  account, you add credibility to your Farcaster account.
                </p>
                <br></br>
                The zero-knowledge proof created on this pages demonstrates the following:
                <br></br> &nbsp; 1. You own an Ethereum address that satisfies a condition (e.g.
                first 100 Beacon depositors)
                <br></br>
                &nbsp;2. You own a Farcaster account with a designated recovery address/FID.
                <br></br>
                <br></br>
                <p>
                  This implies “linking” your Ethereum address that has certain credibility to your
                  Farcaster account, without revealing the Ethereum address.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="mt-8 flex justify-center">
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

        <Card>
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle className="text-xl">1. Create a Farcaster account</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>
              You can create a Farcaster account via{' '}
              <a href="https://warpcast.com/" className="text-blue-500 underline">
                Warpcast{' '}
              </a>
              or
              <a href="https://flink.fyi/" className="text-blue-500 underline">
                {' '}
                flink
              </a>
              .
            </p>
            <p>Skip this step if you already have a Farcaster account.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle className="text-xl">2. Set a recovery address</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>
              By default, accounts created through Warpcast will haven an address controlled by
              Warpcast as its recovery address.
            </p>
            <br></br>
            <p>
              Update the recovery address to an address that you control. This address should be
              different from the <b>source address</b> that you use in Step 3.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle className="text-xl">3. Verify source address</CardTitle>
            </div>
            <CheckableButton onClick={signWithSourceAddress} check={sourceAccountSig !== null}>
              Sign
            </CheckableButton>
          </CardHeader>
          <CardContent>
            <p>
              Connect and sign with an Ethereum address to link to your Farcaster account. The
              address will be kept private by zero-knowledge proof.
            </p>
            {sourceAddress && (
              <div className="flex-col justify-center">
                <div className="flex">
                  Source address verified
                  <CheckCircle2 className="ml-2 text-green-500"></CheckCircle2>
                </div>
                <div>
                  <b>{sourceAddress}</b>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle className="text-xl">4. Verify Farcaster recovery address</CardTitle>
            </div>
            <div>
              <CheckableButton onClick={signWithRecoveryAddress} check={fid != null}>
                Sign
              </CheckableButton>
            </div>
          </CardHeader>
          <CardContent className="mt-4 flex-col justify-center">
            <p>
              Connect and sign with the recovery address from Step 2. This verifies that you control
              the Farcaster account.
            </p>
            <div>
              {fid && (
                <div className="flex-col space-y-4">
                  <div className="flex">
                    Recovery address verified
                    <CheckCircle2 className="ml-2 text-green-500"></CheckCircle2>
                  </div>
                  <div>
                    <b> {fcAddress}</b>
                  </div>
                </div>
              )}
            </div>
            <div>
              {fidNotFound && (
                <span>
                  Farcaster account not found with recovery address <b>{fcAddress}</b>.
                </span>
              )}
            </div>
            <div>
              {searchingFid && (
                <div className="flex items-center justify-center">
                  Searching Farcaster account
                  <div className="ml-4">{<Loader2 className="mr-2 h-4 w-4 animate-spin" />}</div>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4">
              {fcProfile && (
                <>
                  <FcAvatar image={fcProfile.image}></FcAvatar>
                  <div>
                    <span className="block text-lg font-bold">{fcProfile?.name}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <CheckableButton onClick={handleProveClick} disabled={!readyToProve || proving}>
            {proving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {proving ? 'Proving' : 'Prove'}
          </CheckableButton>
        </div>
        <div className="flex justify-center">
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
