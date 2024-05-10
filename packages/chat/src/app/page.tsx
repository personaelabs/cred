'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/rooms');
  }, [router]);

  return <div className="bg-background h-[100%]"></div>;
}
