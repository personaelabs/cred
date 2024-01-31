'use client';
import { UserAccount } from '@/app/types';
import useIdb, { STORE_NAME } from '@/hooks/useIdb';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SIGNER_ID } from '@/hooks/useSigner';
import { useRouter } from 'next/navigation';
import { IDBPDatabase } from 'idb';
import { getPubKey } from '@/lib/utils';
import { Hex } from 'viem';
import { SignerSelect } from '@/app/api/users/[pubKey]/route';

const UserAccountContext = createContext<{
  account: UserAccount | null;
  pubKey: Hex | null;
  signer: SignerSelect | null;
}>({
  account: null,
  pubKey: null,
  signer: null,
});

export const useUserAccount = () => {
  return useContext(UserAccountContext);
};

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

  await db.add(STORE_NAME, userAccount, SIGNER_ID);

  return userAccount;
};

const loadOrCreateAccount = async (db: IDBPDatabase): Promise<UserAccount> => {
  let userAccount = (await db.get(STORE_NAME, SIGNER_ID)) as UserAccount | null;

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
  const [signer, setSigner] = useState<null | SignerSelect>(null);

  const db = useIdb();

  useEffect(() => {
    (async () => {
      if (db) {
        const userAccount = await loadOrCreateAccount(db);
        setPubKey(await getPubKey(userAccount));
        setAccount(userAccount);
      }
    })();
  }, [db, router]);

  useEffect(() => {
    if (pubKey) {
      (async () => {
        const res = await fetch(`/api/users/${pubKey}`);

        if (res.status === 200) {
          const _signer = (await res.json()) as SignerSelect;
          setSigner(_signer);
        }
      })();
    }
  }, [pubKey]);

  return (
    <UserAccountContext.Provider
      value={{
        account,
        pubKey,
        signer,
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
}
