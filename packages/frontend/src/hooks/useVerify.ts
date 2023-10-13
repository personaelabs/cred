import { FullProof } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import * as Comlink from 'comlink';
import { Verifier } from '@/lib/verifier';

let worker: Comlink.Remote<typeof Verifier>;

export const useVerify = () => {
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    worker = Comlink.wrap(new Worker(new URL('../lib/verifier.ts', import.meta.url)));
    // Initialize the web worker
    worker.prepare();
  }, []);

  const verify = async (fullProof: FullProof): Promise<boolean> => {
    if (!worker) {
      throw new Error('Verifier not initialized');
    }

    setVerifying(true);
    const result = await worker.verify(fullProof);
    setVerifying(false);
    return result;
  };

  return { verify, verifying };
};
