'use client';
import { UserAccount } from '@/app/types';
import useIdb, { STORE_NAME } from '@/hooks/useIdb';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SIGNER_KEY } from '@/hooks/useSigner';
import { useRouter } from 'next/navigation';
import { IDBPDatabase } from 'idb';
import { getPubKey } from '@/lib/utils';
import { Hex } from 'viem';
import { AttestationSelect } from '@/app/api/users/[pubKey]/attestations/route';

const UserAccountContext = createContext<{
  account: UserAccount | null;
  pubKey: Hex | null;
  attestations: AttestationSelect[] | null;
}>({
  account: null,
  pubKey: null,
  attestations: null,
});

export const useUserAccount = () => {
  return useContext(UserAccountContext);
};

/**
 * Generate a new ECDSA key pair using the Web Crypto API
 */
const initKeyPair = async (): Promise<CryptoKeyPair> => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );

  return key;
};

const createAccount = async (db: IDBPDatabase): Promise<UserAccount> => {
  const keyPair = await initKeyPair();

  const userAccount: UserAccount = {
    privKey: keyPair.privateKey,
    pubKey: keyPair.publicKey,
  };

  await db.add(STORE_NAME, userAccount, SIGNER_KEY);

  return userAccount;
};

/**
 * Load or create a `UserAccount`
 */
const loadOrCreateAccount = async (db: IDBPDatabase): Promise<UserAccount> => {
  let userAccount = (await db.get(
    STORE_NAME,
    SIGNER_KEY
  )) as UserAccount | null;

  if (!userAccount) {
    userAccount = await createAccount(db);
  }

  return userAccount;
};

export function UserAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [pubKey, setPubKey] = useState<Hex | null>(null);
  const router = useRouter();
  const [attestations, setAttestations] = useState<null | AttestationSelect[]>(
    null
  );

  const db = useIdb();

  useEffect(() => {
    (async () => {
      // Load or create a `UserAccount` and set it in the context
      if (db) {
        const userAccount = await loadOrCreateAccount(db);
        setPubKey(await getPubKey(userAccount));
        setAccount(userAccount);
      }
    })();
  }, [db, router]);

  useEffect(() => {
    if (pubKey) {
      // Fetch attestations and set them in the context
      (async () => {
        const res = await fetch(`/api/users/${pubKey}/attestations`);

        if (res.status === 200) {
          const _attestations = (await res.json()) as AttestationSelect[];
          setAttestations(_attestations);
        } else {
          throw new Error('Failed to fetch attestations');
        }
      })();
    }
  }, [pubKey]);

  return (
    <UserAccountContext.Provider
      value={{
        account,
        pubKey,
        attestations,
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
}
