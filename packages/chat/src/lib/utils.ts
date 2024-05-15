import axios from './axios';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Hex } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const cutoffMessage = (message: string, length: number) => {
  if (message.length > length) {
    return `${message.slice(0, length)}...`;
  }
  return message;
};

export const trimAddress = (address: Hex) => {
  const start = address.substring(0, 6); // "0x" + first 4 chars
  const end = address.substring(address.length - 4); // last 4 chars
  return `${start}...${end}`;
};

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

export const log = async (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    await axios.post('api/log', {
      message,
    });
  }
};
