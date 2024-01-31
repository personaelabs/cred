'use client';
import PostWriter from '@/components/PostWriter';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReplyWriter from '@/components/ReplyWriter';
import { useUserAccount } from '@/contexts/UserAccountContext';
import { useAccount } from 'wagmi';

export default function Home() {
  const [isPostWriterOpen, setIsPostWriterOpen] = useState<null | string>(null);
  const [isReplyWriterOpen, setIsReplyWriterOpen] = useState<null | string>(
    null
  );
  const router = useRouter();
  const { isConnected, isConnecting } = useAccount();

  if (isConnecting === false && isConnected === false) {
    router.push('/onboarding');
  }

  const { signer } = useUserAccount();

  // Redirect to /verify if user is not verified
  if (signer?.attestations.length === 0) {
    router.push('/groups/dev/verify');
  }

  return (
    <>
      <div className="h-[80vh] flex flex-col gap-10 justify-start items-center"></div>
      <PostWriter
        isOpen={isPostWriterOpen ? true : false}
        space={isPostWriterOpen ? (isPostWriterOpen as string) : ''}
        onClose={() => setIsPostWriterOpen(null)}
        onSubmit={() => {
          setIsPostWriterOpen(null);
        }}
      ></PostWriter>
      <ReplyWriter
        isOpen={isReplyWriterOpen ? true : false}
        space={isReplyWriterOpen ? (isReplyWriterOpen as string) : ''}
        onClose={() => setIsReplyWriterOpen(null)}
        onSubmit={() => {
          setIsReplyWriterOpen(null);
        }}
      ></ReplyWriter>
    </>
  );
}
