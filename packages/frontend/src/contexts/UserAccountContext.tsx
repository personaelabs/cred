'use client';
import { TwitterAccount, UserAccount } from '@/app/types';
import useIdb, { STORE_NAME } from '@/hooks/useIdb';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SIGNER_ID } from '@/hooks/useSigner';
import { useRouter } from 'next/navigation';
import { IDBPDatabase } from 'idb';
import { getPubKey, toHexString } from '@/lib/utils';
import { Hex } from 'viem';
import { VerificationSelect } from '@/app/api/users/[pubKey]/verifications/route';
import { User } from '@prisma/client';

const UserAccountContext = createContext<{
  account: UserAccount | null;
  pubKey: Hex | null;
  verifications: VerificationSelect[] | null;
  twitterAccount: TwitterAccount | null;
}>({
  account: null,
  pubKey: null,
  verifications: null,
  twitterAccount: null,
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
  const [verifications, setVerifications] = useState<
    null | VerificationSelect[]
  >(null);
  const [twitterAccount, setTwitterAccount] = useState<TwitterAccount | null>(
    null
  );

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
        const res = await fetch(`/api/users/${pubKey}/verifications`);

        if (res.status === 200) {
          const _verifications = (await res.json()) as VerificationSelect[];
          setVerifications(_verifications);

          // Set the first verification as the twitter account for now.
          // TODO: Allow user to select which account to use.
          if (_verifications.length > 0) {
            setTwitterAccount(_verifications[0].User);
          }
        }
      })();
    }
  }, [pubKey]);

  return (
    <UserAccountContext.Provider
      value={{
        account,
        pubKey,
        verifications,
        twitterAccount,
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
}
