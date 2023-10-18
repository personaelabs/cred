import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useGetUserProofs } from '@/hooks/useGetUserProofs';
import { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function UserPage() {
  const router = useRouter();

  const getUserProofs = useGetUserProofs();

  const [sets, setSets] = useState<string[]>([]);
  // const [proofs, setProofs] = useState<string[]>([]);

  const handle = router.query.handle as string;

  useEffect(() => {
    const populateSetsAndProofs = async (handle: string) => {
      const data = await getUserProofs(handle, true);

      console.log(data);

      const sets = data.map((proof: any) => {
        const publicInput = PublicInput.deserialize(
          Buffer.from(proof.publicInput.replace('0x', ''), 'hex'),
        );
        const groupRoot = publicInput.circuitPubInput.merkleRoot;
        return ROOT_TO_SET[groupRoot.toString()];
      });

      // TODO: set proofs for verification too

      setSets(sets);
    };

    if (handle && sets.length === 0) {
      populateSetsAndProofs(handle).catch(console.error);
    }
  }, [handle, getUserProofs, sets.length]);

  return (
    <>
      <main>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>{handle}</CardTitle>
            {/* TODO: do a better job here of telling a user how to access all of their addresses. */}
          </CardHeader>

          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                {sets.length === 0 ? (
                  <Label>No creddd added for {handle}</Label>
                ) : (
                  <div>
                    {sets.map((set) => (
                      <Badge key={set}>{SET_METADATA[set].displayName}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>{/* TODO: verifying loader or verified message */}</CardFooter>
        </Card>
      </main>
    </>
  );
}
