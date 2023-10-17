import { useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useProve } from '@/hooks/useProve';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useCallback, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
import SETS from '@/lib/sets';
import { Hex } from 'viem';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

// Get all addresses of the sets
const getSets = async () => {
  const addresses = await Promise.all(
    SETS.map(async (set) => {
      const { data }: { data: string[] } = await axios.get(`/${set}.addresses.json`);
      return { set, addresses: data };
    }),
  );

  return addresses;
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const [username, setUsername] = useState<string>('');
  // The set to prove membership
  const [selectedSet, setSelectedSet] = useState<string | undefined>();
  const [proving, setProving] = useState(false);
  const [eligibleSets, setEligibleSets] = useState<string[]>([]);

  // Hash of the generate proof
  const [proofHash, setProofHash] = useState<string | undefined>();

  const { signMessageAsync } = useSignMessage();

  const { prove } = useProve();
  const submitProof = useSubmitProof();
  const getMerkleProof = useGetMerkleProof();

  // Update the eligible sets when the address changes
  useEffect(() => {
    (async () => {
      if (address) {
        // Fetch all the addresses of the sets
        const sets = await getSets();

        // The addresses returned from the backend are in base 10 string format
        const addressBI = BigInt(address).toString(10);

        // Get the eligible sets
        const _eligibleSets = sets
          .filter((set) => set.addresses.includes(addressBI))
          .map((set) => set.set);

        setEligibleSets(_eligibleSets);
        setSelectedSet(_eligibleSets[0]);
      } else {
        setEligibleSets([]);
        setSelectedSet(undefined);
      }
    })();
  }, [address]);

  const handleProveClick = useCallback(async () => {
    if (selectedSet && address) {
      // TODO: Add a timestamp to the message being signed?
      const message = username;
      const sig = await signMessageAsync({ message });

      setProving(true);
      // Get the merkle proof from the backend
      const merkleProof = await getMerkleProof(selectedSet, address);

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
  }, [selectedSet, address, username, signMessageAsync, getMerkleProof, submitProof, prove]);

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Add creddd</CardTitle>
        <CardDescription>Select a name and add personae</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="name" />
              <p className="text-muted-foreground text-sm">
                i.e. Twitter, Farcaster, Lens username
              </p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Added personae</Label>
              <div className="">
                <Badge>Large contract developer</Badge>
                <Badge>Genesis Staker</Badge>
                <Badge>Early validator</Badge>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Eligible personae</Label>

              <div>
                <div className="flex items-center space-x-2">
                  <Switch id="large-nft-trader" disabled />
                  <Badge variant="outline">Large NFT Trader</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Connect account <code>0x321...321</code>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="nouns-forker" />
                <Badge variant="outline">Nouns Fork 0</Badge>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button>Add</Button>
      </CardFooter>
    </Card>
    // // Copied the <main> and the <div> tag under it from https://github.com/personaelabs/noun-nyms/blob/main/packages/frontend/src/pages/index.tsx
    // <main className="flex min-h-screen w-full justify-center bg-gray-50">
    //   <div className="flex h-full w-full max-w-3xl flex-col gap-4 px-4 py-3 md:px-0 md:py-6 ">
    //     <div className="mb-16 flex justify-end">
    //       <ConnectButton
    //         chainStatus={'none'}
    //         accountStatus={'address'}
    //         showBalance={false}
    //       ></ConnectButton>
    //     </div>
    //     <div className="mb-2 flex justify-center">
    //       <input
    //         onChange={(e) => {
    //           setUsername(e.target.value);
    //         }}
    //         value={username}
    //         className="border-b-2 bg-transparent"
    //         type="text"
    //         placeholder="username"
    //       ></input>
    //     </div>
    //     <div className="mb-2 flex justify-center">
    //       <select
    //         className="border-2 bg-transparent"
    //         onChange={(e) => {
    //           setSelectedSet(e.target.value);
    //         }}
    //         value={selectedSet}
    //         placeholder="Select a set"
    //       >
    //         <option value="" disabled selected={!selectedSet}>
    //           Select a set
    //         </option>
    //         {eligibleSets.map((set) => (
    //           // Render the eligible sets
    //           <option key={set} value={set}>
    //             {set} (eligible)
    //           </option>
    //         ))}
    //         {
    //           // Render the ineligible sets as disabled options
    //           SETS.filter((set) => !eligibleSets.includes(set)).map((set) => (
    //             <option key={set} value={set} disabled>
    //               {set} (ineligible)
    //             </option>
    //           ))
    //         }
    //       </select>
    //     </div>
    //     <div className="mb-2 flex justify-center">
    //       <MainButton
    //         message={proving ? 'Proving' : 'Prove'}
    //         handler={handleProveClick}
    //         disabled={!isConnected}
    //         loading={proving}
    //       ></MainButton>
    //     </div>
    //     <div className="flex  justify-center">
    //       {proofHash && (
    //         <div>
    //           <p>Done! Proof hash: {proofHash}</p>
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </main>
  );
}
