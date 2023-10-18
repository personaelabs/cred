import { FcAvatar } from '@/components/global/FcAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFcAnonAccount } from '@/hooks/useFcAnonAccount';
import { useRouter } from 'next/router';

export default function FcAccount() {
  const router = useRouter();
  const fid = router.query.fid as string;

  const { fcAnon } = useFcAnonAccount(parseInt(fid));

  return (
    <main className="flex min-h-screen w-full justify-center bg-gray-50">
      <div className="align-center flex h-full w-full max-w-xl flex-col gap-8 px-4 py-3 md:px-0 md:py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{fcAnon?.profile.name}</CardTitle>
            <FcAvatar image={fcAnon?.profile.image || ''}></FcAvatar>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    </main>
  );
}
