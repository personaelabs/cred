import { useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import SETS, { SET_METADATA } from '@/lib/sets';
import { useCircuit } from '@/hooks/useCircuit';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useCallback, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
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
import { useGetUserSets } from '@/hooks/useGetUserSets';
import { Hex } from 'viem';
import { Loader2 } from 'lucide-react';

// Number of Merkle proofs that can be proven at once
const NUM_MERKLE_PROOFS = 4;

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
  const [proving, setProving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eligibleSets, setEligibleSets] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);

  // Hash of the generate proof
  const [proofHash, setProofHash] = useState<string | undefined>();
  const { signMessageAsync } = useSignMessage();

  const { proveV4 } = useCircuit();
  const submitProof = useSubmitProof();
  const getMerkleProof = useGetMerkleProof();
  const { userSets, getUserSets, fetchingUserSet, resetUserSets } = useGetUserSets();

  // Update the eligible sets when the address changes
  useEffect(() => {
    (async () => {
      if (address && userSets) {
        // Fetch all the addresses of the sets
        const sets = await getSets();

        // The addresses returned from the backend are in base 10 string format
        const addressBI = BigInt(address).toString(10);

        // Get the eligible sets
        const _eligibleSets = sets
          .filter((set) => set.addresses.includes(addressBI))
          // Filter out sets that have already been added
          .filter((set) => !userSets.includes(set.set))
          .map((set) => set.set);

        setEligibleSets(_eligibleSets);
      } else {
        setEligibleSets([]);
      }
    })();
  }, [address, userSets]);

  const handleProveClick = useCallback(async () => {
    if (selectedSets && address) {
      const message = username;
      const sig = await signMessageAsync({ message });

      setProving(true);

      // Get the merkle proof from the backend
      const merkleProofs = await Promise.all(
        selectedSets.map((set) => {
          return getMerkleProof(set, address);
        }),
      );

      // Pad the merkle proofs to NUM_MERKLE_PROOFS
      while (merkleProofs.length < NUM_MERKLE_PROOFS) {
        merkleProofs.push(merkleProofs[0]);
      }

      let proof: Hex;
      // When NEXT_PUBLIC_USE_TEST_PROOF is true, we skip the proving step and use dummy proof.
      // The backend is aware of this dummy proof and will accept it.
      // This is useful for testing the UI.
      if (process.env.NEXT_PUBLIC_USE_TEST_PROOF === 'true') {
        proof = '0x';
      } else {
        //  Prove!
        proof = await proveV4(sig, username, merkleProofs);
      }

      //Submit the proof to the backend
      const proofHash = await submitProof({ proof, message });
      setProofHash(proofHash);
      setProving(false);
    }
  }, [selectedSets, address, username, signMessageAsync, submitProof, getMerkleProof, proveV4]);

  const readyToProve = selectedSets.length > 0 && isConnected && !proving;
  return (
    <main>
      <nav className="flex justify-end">
        <ConnectButton accountStatus={'address'} showBalance={false} />
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
            <div className="flex flex-row items-end space-x-2">
              <div className="flex w-3/4 flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                  value={username}
                  id="name"
                  placeholder="name"
                  disabled={userSets != null}
                />
              </div>
              {userSets ? (
                <Button
                  className="w-1/4"
                  onClick={() => {
                    resetUserSets();
                    setUsername('');
                  }}
                >
                  Clear
                </Button>
              ) : (
                <Button
                  className="w-1/4"
                  onClick={() => {
                    getUserSets(username);
                  }}
                  disabled={!username}
                >
                  Search
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm">i.e. Twitter, Farcaster, Lens username</p>
            {userSets && (
              <>
                <div className="flex flex-col space-y-1.5">
                  {userSets.length === 0 ? (
                    <Label>
                      No added creddd
                      {username.length > 0 ? <span> for {username}</span> : <></>}
                    </Label>
                  ) : (
                    <div>
                      <Label>Added creddd</Label>
                      <div className="">
                        {userSets.map((set, i) => (
                          <Badge className="mt-1" key={i}>
                            {SET_METADATA[set].displayName}
                          </Badge>
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
                          // Filter out sets that have already been added
                          .filter((set) => !userSets.includes(set))
                          .map((set, i) => (
                            <div key={i}>
                              <div className="mt-1 flex items-center space-x-2">
                                <Switch
                                  disabled={
                                    fetchingUserSet ||
                                    (!selectedSets.includes(set) &&
                                      selectedSets.length >= NUM_MERKLE_PROOFS)
                                  }
                                  id={set}
                                  checked={selectedSets.includes(set)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSets((sets) => [...sets, set]);
                                    } else {
                                      setSelectedSets((sets) => sets.filter((s) => s !== set));
                                    }
                                  }}
                                />
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
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {userSets && (
            <>
              <Button onClick={handleProveClick} disabled={!readyToProve}>
                {proving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {proving ? 'Adding' : 'Add'}
              </Button>
              <div>
                {!proofHash && (
                  <a
                    className="text-sm"
                    href={`/user/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View profile
                  </a>
                )}
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
