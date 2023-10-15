import { useAccount, useSignMessage, useContractEvent, useDisconnect, useConnect } from 'wagmi';
import { ConnectButton, useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import { MainButton } from '@/components/MainButton';
import { useCallback, useEffect, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
import SETS, { SET_METADATA } from '@/lib/sets';
import { Hex } from 'viem';
import { getFid } from '@/lib/fc';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle, CheckCircle2, CheckSquare } from 'lucide-react';
import { useFaAnonCircuit } from '@/hooks/useFcAnonCircuit';
import Spinner from '@/components/global/Spinner';
import { useFcProfile } from '@/hooks/useFcProfile';
import { useSubmitFcAnonProof } from '@/hooks/useSubmitFcAnonProof';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const CheckableButton = (props?: any) => (
  <Button
    {...props}
    disabled={props?.check || props?.disabled}
    style={{
      backgroundColor: '#7c65c1',
    }}
  >
    {props?.check && <Check className="mr-2 h-4 w-4"></Check>}
    {props.children}
  </Button>
);

const FCButton = (props: any) => {
  return <MainButton color="#7c65c1" {...props}></MainButton>;
};

export default function FcAnon() {
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { connectAsync } = useConnect();
  const { openConnectModal } = useConnectModal();

  // The set to prove membership
  const [selectedSet, setSelectedSet] = useState(SETS[0]);
  const [proving, setProving] = useState(false);
  const [fid, setFid] = useState<string | null>(null);
  const [fetchFcProfile, { data: fcProfile }] = useFcProfile(fid || '');

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

  const { prove } = useFaAnonCircuit();
  const submitFcAnonProof = useSubmitFcAnonProof();
  const getMerkleProof = useGetMerkleProof(selectedSet);
  console.log({ fcProfile });
  // When the FID is found, fetch the profile
  useEffect(() => {
    (async () => {
      if (fid) {
        const { data } = await fetchFcProfile();
        console.log(data.Socials.Social);
      }
    })();
  }, [fid, fetchFcProfile]);

  //  const [fetch, { data, loading, error }] = useLazyQuery(query, variables);

  const handleProveClick = useCallback(async () => {
    if (sourceAddress && fid && sourceAccountSig && fcAccountSig) {
      setProving(true);

      // Get the merkle proof from the backend
      const merkleProof = await getMerkleProof(sourceAddress);

      // Prove!
      let proof: Hex;
      // When NEXT_PUBLIC_USE_TEST_PROOF is true, we skip the proving step and use dummy proof.
      // The backend is aware of this dummy proof and will accept it.
      // This is useful for testing the UI.
      if (process.env.NEXT_PUBLIC_USE_TEST_PROOF === 'true') {
        proof = '0x';
      } else {
        // Prove!
        proof = await prove(fcAccountSig, sourceAccountSig, fid, merkleProof);
      }

      // Submit the proof to the backend
      const proofHash = await submitFcAnonProof(proof);
      setProofHash(proofHash);
      setProving(false);
    }
  }, [
    sourceAddress,
    fid,
    sourceAccountSig,
    fcAccountSig,
    getMerkleProof,
    submitFcAnonProof,
    prove,
  ]);

  const signWithRecoveryAddress = useCallback(async () => {
    if (address) {
      const message = `I'm linking my Farcaster account to the set ${SET_METADATA[selectedSet]}`;
      const sig = await signMessageAsync({ message });

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
  }, [address, selectedSet, signMessageAsync]);

  const signWithSourceAddress = useCallback(async () => {
    if (address) {
      const message = `I'm linking my Farcaster account to the set ${SET_METADATA[selectedSet]}`;
      const sig = await signMessageAsync({ message });
      setSourceAddress(address);
      setSourceAccountSig(sig);
    }

    // setFcAccountSig(sig);
  }, [address, selectedSet, signMessageAsync]);

  const readyToProve = fcAccountSig && sourceAccountSig && fid;
  const fcProfileImage = fcProfile?.Socials?.Social[0]?.profileImage;
  const fcProfileName = fcProfile?.Socials?.Social[0]?.profileName;

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
        <div className="flex justify-center">
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
              <CardTitle className="text-xl">1. Sign with source address</CardTitle>
            </div>
            <CheckableButton onClick={signWithSourceAddress} check={sourceAccountSig !== null}>
              Sign
            </CheckableButton>
          </CardHeader>
          <CardContent>
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
              <CardTitle className="text-xl">2. Sign with Farcaster recovery address</CardTitle>
              <CardDescription>
                Please select a different address from the source account
              </CardDescription>
            </div>
            <div>
              <CheckableButton onClick={signWithRecoveryAddress} check={fid}>
                Sign
              </CheckableButton>
            </div>
          </CardHeader>
          <CardContent className="mt-4 flex-col justify-center">
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
                  <div className="ml-4">
                    <Spinner></Spinner>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4">
              {fcProfileImage && (
                <Avatar>
                  <Image
                    src={fcProfileImage}
                    fill
                    alt="User Avatar"
                    className="rounded-full border-2 border-gray-600"
                  />
                  <AvatarFallback>FC</AvatarFallback>
                </Avatar>
              )}
              <div>
                <span className="block text-lg font-bold">{fcProfileName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <CheckableButton onClick={handleProveClick} disabled={!readyToProve}>
            {proving ? 'Proving...' : 'Prove'}
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
