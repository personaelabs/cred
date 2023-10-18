import { useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useProve } from '@/hooks/useProve';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useCallback, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
import SETS, { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
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
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGetUserProofs } from '@/hooks/useGetUserProofs';
import { PublicInput } from '@personaelabs/spartan-ecdsa';

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
  // TODO: multi-set proving will change what we store here
  const [selectedSet, setSelectedSet] = useState<string | undefined>();
  const [proving, setProving] = useState(false);

  const [eligibleSets, setEligibleSets] = useState<string[]>([]);
  const [addedSets, setAddedSets] = useState<string[]>([]);

  // Hash of the generate proof
  const [proofHash, setProofHash] = useState<string | undefined>();

  const { signMessageAsync } = useSignMessage();

  const { prove } = useProve();
  const submitProof = useSubmitProof();
  const getMerkleProof = useGetMerkleProof();
  const getUserProofs = useGetUserProofs();

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

  // Update the added creddd when the username changes
  useEffect(() => {
    (async () => {
      // Retrieve sets associated with username from server
      const getAddedSets = async () => {
        if (!username) {
          setAddedSets([]);
          return;
        }

        console.log(username);
        const data = await getUserProofs(username);

        // TODO: cache added sets?
        const _addedSets = data.map((proof: any) => {
          const publicInput = PublicInput.deserialize(
            Buffer.from(proof.publicInput.replace('0x', ''), 'hex'),
          );
          const groupRoot = publicInput.circuitPubInput.merkleRoot;

          return ROOT_TO_SET[groupRoot.toString()];
        });

        setAddedSets(_addedSets);
      };

      // Use a timer to debounce (500ms) the effect
      const timer = setTimeout(() => {
        getAddedSets();
      }, 500);
    })();
  }, [username, getUserProofs]);

  // TODO: do multi-prove if multiple cred at once
  const handleProveClick = useCallback(async () => {
    console.log('hi');
    // if (selectedSet && address) {
    //   // TODO: Add a timestamp to the message being signed?
    //   const message = username;
    //   const sig = await signMessageAsync({ message });

    //   setProving(true);
    //   // Get the merkle proof from the backend
    //   const merkleProof = await getMerkleProof(selectedSet, address);

    //   let proof: Hex;
    //   let publicInput: Hex;
    //   // When NEXT_PUBLIC_USE_TEST_PROOF is true, we skip the proving step and use dummy proof.
    //   // The backend is aware of this dummy proof and will accept it.
    //   // This is useful for testing the UI.
    //   if (process.env.NEXT_PUBLIC_USE_TEST_PROOF === 'true') {
    //     proof = '0x';
    //     publicInput = '0x';
    //   } else {
    //     // Prove!
    //     const result = await prove(sig, username, merkleProof);
    //     proof = result.proof;
    //     publicInput = result.publicInput;
    //   }

    //   // Submit the proof to the backend
    //   const proofHash = await submitProof({ proof, publicInput, message, proofVersion: 'v2' });
    //   setProofHash(proofHash);
    //   setProving(false);
    // }
  }, [selectedSet, address, username, signMessageAsync, getMerkleProof, submitProof, prove]);

  return (
    <main>
      <nav className="flex justify-end">
        <ConnectButton chainStatus={'none'} accountStatus={'address'} showBalance={false} />
      </nav>

      <br />

      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Creddd</CardTitle>
          <CardDescription>Connect your addresses and add creddd to your name</CardDescription>
          {/* TODO: do a better job here of telling a user how to access all of their addresses. */}
        </CardHeader>

        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                value={username}
                id="name"
                placeholder="name"
              />
              <p className="text-muted-foreground text-sm">
                i.e. Twitter, Farcaster, Lens username
              </p>
            </div>

            <div className="flex flex-col space-y-1.5">
              {addedSets.length === 0 ? (
                <Label>
                  No added creddd
                  {username.length > 0 ? <span> for {username}</span> : <></>}
                </Label>
              ) : (
                <div>
                  <Label>Added creddd</Label>
                  <div className="">
                    {addedSets.map((set) => (
                      <Badge key={set}>{SET_METADATA[set].displayName}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex flex-col space-y-1.5">
              {eligibleSets.length === 0 ? (
                <Label>No eligible creddd for connected addresses</Label>
              ) : (
                <div>
                  <Label htmlFor="framework">Eligible creddd</Label>

                  <div>
                    {eligibleSets
                      .filter((set) => !addedSets.includes(set))
                      .map((set) => (
                        <div key={set}>
                          <div className="flex items-center space-x-2">
                            <Switch id={set} />
                            <Badge variant="outline">{SET_METADATA[set].displayName}</Badge>
                          </div>

                          {/* TODO: message when set doesn't correspond to selected address */}
                          {/* <p className="text-muted-foreground text-sm">
                          Use account <code>0x321...321</code>
                        </p> */}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isConnected ? (
            <Button onClick={handleProveClick}>{proving ? 'Adding' : 'Add'}</Button>
          ) : (
            <Button onClick={handleProveClick} disabled>
              Add
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
