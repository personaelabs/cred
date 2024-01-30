import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Hex } from 'viem';
import { Action, ActionSelector, UserAccount } from '@/app/types';
import { webcrypto } from 'crypto';

export const MAX_TWEET_CHARS = 280;

export const SIG_SALT = Buffer.from(
  '0xdd01e93b61b644c842a5ce8dbf07437f',
  'hex'
);

export const SIG_ALGO = {
  name: 'ECDSA',
  hash: { name: 'SHA-256' },
  namedCurve: 'P-256',
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Copied from https://github.com/ethereumjs/ethereumjs-monorepo/blob/8ca49a1c346eb7aa61acf550f8fe213445ef71ab/packages/util/src/signature.ts#L46
// Returns if y is odd or not
export const calculateSigRecovery = (v: bigint, chainId?: bigint): boolean => {
  if (v === BigInt(0) || v === BigInt(1)) {
    return v === BigInt(1) ? false : true;
  }

  if (chainId === undefined) {
    if (v === BigInt(27)) {
      return true;
    } else {
      return false;
    }
  }
  if (v === chainId * BigInt(2) + BigInt(35)) {
    return true;
  } else {
    return false;
  }
};

// Encodes a post body into a Buffer
export const encodeActionBody = (postBody: Record<string, any>): Buffer => {
  return Buffer.from(JSON.stringify(postBody), 'utf-8');
};

// Convert a Buffer to a hex string
export const toHexString = (bytes: Uint8Array | ArrayBuffer | Buffer): Hex => {
  return `0x${Buffer.from(bytes).toString('hex')}`;
};

// Convert a hex string to a Buffer
export const fromHexString = (hexString: Hex, size?: number): Buffer => {
  const padded = size
    ? hexString.slice(2).padStart(size * 2, '0')
    : hexString.slice(2);

  return Buffer.from(padded, 'hex');
};

// Concatenates Uint8Arrays into a single Uint8Array
export const concatUint8Arrays = (arrays: Uint8Array[]) => {
  // Calculate combined length
  let totalLength = 0;
  for (let array of arrays) {
    totalLength += array.length;
  }

  // Create a new array with the total length
  let result = new Uint8Array(totalLength);

  // Copy each array into the result array
  let offset = 0;
  for (let array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
};

// Returns the first 6 characters of a public key as a username
export const getUsername = (pubKey: string) => {
  // TODO: Use a better username
  return pubKey.slice(0, 6);
};

export const postJSON = async <T>({
  url,
  body,
  method,
}: {
  url: string;
  body: T;
  method: 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH';
}) => {
  return await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

export const verifySignedAction = async <T extends ActionSelector>(
  body: Action<T>
) => {
  const pubKey = await webcrypto.subtle.importKey(
    'raw',
    fromHexString(body.pubKey),
    SIG_ALGO,
    false,
    ['verify']
  );

  const upvoteBodyBuffer = encodeActionBody(body.body);

  const sig = fromHexString(body.sig);
  const verified = await webcrypto.subtle.verify(
    SIG_ALGO,
    pubKey,
    sig,
    upvoteBodyBuffer
  );

  return verified;
};

export const copyTextToClipboard = async (text: string) => {
  if ('clipboard' in navigator) {
    return await navigator.clipboard.writeText(text);
  } else {
    return document.execCommand('copy', true, text);
  }
};

export const getTweetIdFromUrl = (url: string): string | null => {
  const match = url.match(/https:\/\/twitter\.com\/.*\/status\/(\d+)/);

  if (match) {
    return match[1];
  }

  return null;
};

export const getTweetUrl = ({
  username,
  tweetId,
}: {
  username: string;
  tweetId: string;
}) => {
  return `https://twitter.com/${username}/status/${tweetId}`;
};

// Get the public key as a hex string from `UserAccount`
export const getPubKey = async (userAccount: UserAccount) => {
  const pubKeyRaw = await window.crypto.subtle.exportKey(
    'raw',
    userAccount.pubKey
  );

  return toHexString(pubKeyRaw);
};
