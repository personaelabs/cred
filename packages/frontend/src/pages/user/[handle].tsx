import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useGetUserProofs } from '@/hooks/useGetUserProofs';
import { SET_METADATA } from '@/lib/sets';
import { useRouter } from 'next/router';
import { use, useEffect, useState } from 'react';
import { useGetUserSets } from '@/hooks/useGetUserSets';
import { useCircuit } from '@/hooks/useCircuit';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function UserPage() {
  const router = useRouter();

  const { userProofs, getUserProofs } = useGetUserProofs();
  const { userSets, getUserSets } = useGetUserSets();
  const [verifyingProofs, setVerifyingProofs] = useState<boolean>(true);
  const [verificationFailed, setVerificationFailed] = useState<boolean>(false);
  const { verify } = useCircuit();

  const handle = router.query.handle as string;

  useEffect(() => {
    if (handle) {
      getUserSets(handle);
    }
  }, [getUserProofs, getUserSets, handle]);

  useEffect(() => {
    if (handle) {
      getUserProofs(handle);
    }
  }, [handle, getUserProofs]);

  // Verify proofs
  useEffect(() => {
    (async () => {
      if (userProofs) {
        let failed = false;
        for (let i = 0; i < userProofs.length; i++) {
          const proof = userProofs[i];
          const verified = await verify(proof);
          if (!verified) {
            failed = true;
            break;
          }
        }

        if (failed) {
          setVerificationFailed(true);
        }

        setVerifyingProofs(false);
      }
    })();
  }, [userProofs, verify]);

  return (
    <>
      <main>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>{handle}</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                {userSets.length === 0 ? (
                  <Label>No creddd added for {handle}</Label>
                ) : (
                  <div>
                    {userSets.map((set, i) => (
                      <Badge key={i}>{SET_METADATA[set].displayName}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center">
              {verifyingProofs && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Verifying</span>
                </>
              )}
              {!verifyingProofs && !verificationFailed && (
                <>
                  <span>Verified!</span>
                  <CheckCircle2 className="ml-2" color="green"></CheckCircle2>
                </>
              )}
              {!verifyingProofs && verificationFailed && <p>Verification failed</p>}
            </div>
          </CardContent>

          <CardFooter>{/* TODO: verifying loader or verified message */}</CardFooter>
        </Card>
      </main>
    </>
  );
}
