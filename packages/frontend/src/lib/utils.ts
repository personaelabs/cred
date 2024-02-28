import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Hex } from 'viem';
import * as Sentry from '@sentry/nextjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * - Copied from https://github.com/ethereumjs/ethereumjs-monorepo/blob/8ca49a1c346eb7aa61acf550f8fe213445ef71ab/packages/util/src/signature.ts#L46
 * - Returns if y is odd or not
 */
//
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

/**
 * Convert a Buffer to `Hex`
 */
export const toHexString = (bytes: Uint8Array | ArrayBuffer | Buffer): Hex => {
  return `0x${Buffer.from(bytes).toString('hex')}`;
};

/**
 * Convert a `Hex` to a Buffer
 */
export const fromHexString = (hexString: Hex, size?: number): Buffer => {
  const padded = size
    ? hexString.slice(2).padStart(size * 2, '0')
    : hexString.slice(2);

  return Buffer.from(padded, 'hex');
};

/**
 * Concatenate multiple Uint8Arrays into a single Uint8Array
 */
export const concatUint8Arrays = (arrays: Uint8Array[]) => {
  // Calculate combined length
  let totalLength = 0;
  for (const array of arrays) {
    totalLength += array.length;
  }

  // Create a new array with the total length
  const result = new Uint8Array(totalLength);

  // Copy each array into the result array
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
};

/**
 * Send a POST request with a JSON body to the specified URL.
 * The caller is responsible for handling errors.
 */
export const postJSON = async <T>({
  url,
  body,
  method,
}: {
  url: string;
  body: T;
  method: 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH';
}): Promise<Response> => {
  const result = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return result;
};

export const buildSiwfMessage = ({
  domain,
  address,
  siweUri,
  nonce,
  issuedAt,
  fid,
}: {
  domain: string;
  address: string;
  siweUri: string;
  nonce: string;
  issuedAt: string;
  fid: number;
}) => {
  return (
    `${domain} wants you to sign in with your Ethereum account:\n` +
    `${address}\n` +
    '\n' +
    'Farcaster Connect\n' +
    '\n' +
    `URI: ${siweUri}\n` +
    'Version: 1\n' +
    'Chain ID: 10\n' +
    `Nonce: ${nonce}\n` +
    `Issued At: ${issuedAt}\n` +
    'Resources:\n' +
    `- farcaster://fid/${fid}`
  );
};

export const captureFetchError = async (response: Response) => {
  const error = await response.json();
  Sentry.captureException(new Error(JSON.stringify(error)));
};
