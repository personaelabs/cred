import { useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import SETS, { SET_METADATA } from '@/lib/sets';
import { useCircuit } from '@/hooks/useCircuit';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useCallback, useState } from 'react';
import { useGetMerkleProof } from '@/hooks/useGetMerkleProof';
import { useConnectedAccounts } from '@/hooks/useAccounts';
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
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGetUserSets } from '@/hooks/useGetUserSets';
import { Hex } from 'viem';
import { Loader2 } from 'lucide-react';
import { ToastAction } from '@radix-ui/react-toast';
import { trimAddress } from '@/lib/utils';

// Number of Merkle proofs that can be proven at once
const NUM_MERKLE_PROOFS = 4;

// Get all addresses of the sets
const getSets = async () => {
  const addresses = await Promise.all(
    SETS.map(async (set) => {
      const { data }: { data: Hex[] } = await axios.get(`/${set}.addresses.json`);
      return { set, addresses: data };
    }),
  );

  return addresses;
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const [username, setUsername] = useState<string>('');

  // Mapping of set to the address that's in the set
  const [eligibleSets, setEligibleSets] = useState<[string, Hex][]>([]);
  // The set to prove membership
  const [selectedSets, setSelectedSets] = useState<string[]>([]);

  // Hash of the generate proof
  const { signMessageAsync } = useSignMessage();

  const { proveV4, proving } = useCircuit();
  const { submitProof, submittingProof } = useSubmitProof();
  const getMerkleProof = useGetMerkleProof();
  const { userSets, getUserSets, fetchingUserSet, resetUserSets } = useGetUserSets();

  const { toast } = useToast();

  const { connectedAccounts } = useConnectedAccounts(isConnected);

  // Update the eligible sets when the address changes
  useEffect(() => {
    (async () => {
      if (address) {
        // Fetch all the addresses of the sets
        const sets = await getSets();

        // Get the eligible sets
        const _eligibleSets: [string, Hex][] = [];

        for (let i = 0; i < connectedAccounts.length; i++) {
          const connectedAddress = connectedAccounts[i];
          _eligibleSets.push(
            ...(sets
              .filter((set) => set.addresses.includes(connectedAddress.toLowerCase() as Hex))
              // Filter out sets that have already been added
              .filter((set) => !userSets?.includes(set.set))
              .map((set) => [set.set, connectedAddress]) as [string, Hex][]),
          );
        }

        // reorder eligible sets according to preset order
        _eligibleSets.sort((a, b) => {
          return SETS.indexOf(a[0]) - SETS.indexOf(b[0]);
        });

        setEligibleSets(_eligibleSets);
        setSelectedSets([]);
      } else {
        setEligibleSets([]);
        setSelectedSets([]);
      }
    })();
  }, [address, connectedAccounts, userSets]);

  const handleProveClick = useCallback(async () => {
    if (selectedSets && address) {
      const message = username;
      const sig = await signMessageAsync({ message });

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
      await submitProof({ proof, message });
      toast({
        title: 'Added creddd',
        duration: 60000, // 1 minute.
        action: <ToastAction altText="close">Close</ToastAction>,
      });

      // Re-fetch the user sets
      getUserSets(username);
    }
  }, [
    selectedSets,
    address,
    username,
    signMessageAsync,
    submitProof,
    toast,
    getUserSets,
    getMerkleProof,
    proveV4,
  ]);

  const readyToProve = selectedSets.length > 0 && isConnected && !proving && !submittingProof;
  return (
    <main>
      <Card className="mt-4 w-[350px] md:w-[450px]">
        <CardHeader>
          <CardTitle>Creddd</CardTitle>
          <CardDescription>add creddd to your name from any of your addresses</CardDescription>
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
                    setSelectedSets([]);
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
            {fetchingUserSet && (
              <div className="flex items-center justify-center space-x-2">
                <p>Searching</p>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </div>
            )}
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
              </>
            )}

            <Separator />

            <div className="flex flex-col space-y-1.5">
              {eligibleSets.length === 0 ? (
                <Label>No eligible creddd for connected addresses</Label>
              ) : (
                <div>
                  <Label htmlFor="framework">Eligible creddd</Label>
                  {selectedSets.length >= NUM_MERKLE_PROOFS && (
                    <p className="text-sm">You can only add {NUM_MERKLE_PROOFS} creddd at a time</p>
                  )}
                  <div>
                    {eligibleSets
                      // Filter out sets that have already been added
                      .filter(([set, _]) => !userSets?.includes(set))
                      .map(([set, eligibleAddr], i) => (
                        <div key={i}>
                          <div className="mt-1 flex items-center space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Switch
                                    disabled={
                                      address !== eligibleAddr ||
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
                                </div>
                              </TooltipTrigger>
                              {
                                // Only show tooltip for addresses that are not currently connected
                                address !== eligibleAddr && (
                                  <TooltipContent>
                                    <p>Switch to account {eligibleAddr}</p>
                                  </TooltipContent>
                                )
                              }
                            </Tooltip>
                            <Badge variant="outline">{SET_METADATA[set].displayName}</Badge>
                            {
                              // Only show tooltip for addresses that are not currently connected
                              address !== eligibleAddr && (
                                <p className="text-xs">use {trimAddress(eligibleAddr)}</p>
                              )
                            }
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {userSets && (
            <>
              <Button onClick={handleProveClick} disabled={!readyToProve}>
                {(proving || submittingProof) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {proving ? 'Proving' : submittingProof ? 'Submitting' : 'Save'}
              </Button>

              <div>
                <a
                  className="text-sm underline"
                  href={`/user/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View profile
                </a>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
