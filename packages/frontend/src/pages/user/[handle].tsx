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
import { MembershipProof } from '@prisma/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import { useGetUserSets } from '@/hooks/useGetUserSets';

export default function UserPage() {
  const router = useRouter();

  const getUserProofs = useGetUserProofs();
  const { userSets, getUserSets } = useGetUserSets();

  const handle = router.query.handle as string;

  useEffect(() => {
    if (handle) {
      getUserSets(handle);
    }
  }, [getUserSets, handle]);

  // TODO: Verify the proofs

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
                {userSets.length === 0 ? (
                  <Label>No creddd added for {handle}</Label>
                ) : (
                  <div>
                    {userSets.map((set) => (
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
