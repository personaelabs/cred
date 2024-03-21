import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Hex } from 'viem';
import * as Sentry from '@sentry/nextjs';
import { GroupType } from '@prisma/client';

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

/**
 * Returns a description of the creddd from the group type and handle
 */
export const getCredddDescription = (
  groupName: string,
  groupType: GroupType | null
): string | null => {
  switch (groupType) {
    case GroupType.AllHolders: {
      const tokenName = groupName.replaceAll('historical holder', '').trim();
      return `This indicates the user held at least 1 ${tokenName} at any point in time in the past.`;
    }
    case GroupType.Whale: {
      const tokenName = groupName.replaceAll('whale', '').trim();
      return `This indicates that at some point in time the user held >0.1% of the outstanding supply of ${tokenName}. `;
    }
    case GroupType.EarlyHolder: {
      const tokenName = groupName
        .replaceAll('Early', '')
        .replaceAll('holder', '')
        .trim();
      return `This indicates the user was in the first 5% of addresses that ever traded, bought, or otherwise interacted with ${tokenName}.`;
    }
    case GroupType.Ticker: {
      return `This indicates the user controlled wallets with >0 $ticker balance when $ticker dev rugged.`;
    }
    default:
      return '';
  }
};

export const trimAddress = (address: Hex) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const PRECOMPUTED_HASHES = [
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ],
  [
    42, 106, 236, 60, 219, 199, 235, 47, 135, 38, 26, 208, 190, 66, 208, 203,
    135, 208, 196, 87, 254, 186, 148, 33, 217, 75, 104, 3, 123, 23, 204, 101,
  ],
  [
    41, 235, 49, 168, 222, 206, 42, 58, 150, 51, 228, 157, 242, 239, 56, 200,
    101, 56, 118, 187, 234, 142, 239, 123, 197, 145, 11, 15, 44, 118, 30, 140,
  ],
  [
    126, 134, 173, 214, 88, 154, 187, 171, 28, 238, 115, 216, 202, 155, 104,
    149, 89, 55, 56, 44, 128, 11, 136, 14, 248, 11, 142, 60, 80, 51, 121, 131,
  ],
  [
    214, 100, 63, 136, 51, 97, 211, 179, 195, 189, 84, 246, 160, 72, 24, 102,
    177, 29, 245, 196, 155, 113, 249, 179, 24, 194, 114, 19, 23, 84, 110, 97,
  ],
  [
    77, 217, 194, 187, 215, 38, 165, 159, 226, 106, 208, 152, 84, 171, 230, 49,
    150, 42, 61, 248, 45, 145, 53, 57, 60, 98, 146, 129, 249, 175, 95, 142,
  ],
  [
    173, 91, 78, 215, 93, 94, 193, 95, 126, 57, 247, 41, 45, 134, 43, 151, 112,
    246, 187, 132, 217, 198, 88, 226, 110, 248, 208, 235, 211, 6, 70, 3,
  ],
  [
    113, 7, 200, 73, 135, 101, 104, 51, 201, 187, 253, 119, 245, 2, 130, 1, 12,
    91, 154, 82, 5, 5, 38, 12, 184, 127, 48, 131, 35, 239, 254, 123,
  ],
  [
    181, 225, 96, 176, 243, 63, 108, 201, 173, 230, 231, 241, 177, 84, 35, 100,
    224, 195, 170, 117, 215, 54, 60, 141, 209, 68, 4, 53, 142, 150, 241, 30,
  ],
  [
    226, 112, 50, 238, 111, 49, 76, 203, 234, 235, 233, 160, 28, 15, 255, 112,
    252, 20, 200, 246, 92, 203, 43, 94, 206, 207, 234, 79, 27, 94, 142, 67,
  ],
  [
    132, 33, 50, 234, 14, 224, 18, 195, 65, 94, 56, 202, 223, 17, 84, 149, 91,
    208, 226, 145, 166, 80, 204, 160, 179, 59, 51, 47, 29, 117, 237, 240,
  ],
  [
    26, 3, 113, 83, 14, 151, 37, 183, 222, 124, 203, 131, 77, 3, 70, 48, 184,
    81, 193, 18, 39, 102, 99, 76, 45, 122, 61, 170, 122, 64, 213, 220,
  ],
  [
    130, 135, 103, 194, 80, 104, 175, 90, 89, 71, 193, 128, 21, 245, 32, 128,
    249, 187, 236, 1, 128, 185, 111, 48, 15, 146, 133, 76, 61, 200, 93, 232,
  ],
  [
    80, 118, 192, 44, 31, 39, 209, 155, 68, 19, 227, 156, 215, 65, 78, 136, 234,
    105, 209, 26, 172, 3, 2, 212, 153, 134, 165, 190, 46, 165, 36, 173,
  ],
  [
    169, 93, 222, 25, 44, 34, 6, 10, 213, 187, 225, 44, 112, 218, 21, 76, 182,
    101, 17, 230, 26, 123, 94, 12, 210, 76, 91, 133, 62, 153, 86, 44,
  ],
  [
    185, 4, 184, 105, 242, 122, 207, 233, 197, 40, 120, 183, 145, 141, 137, 14,
    44, 143, 79, 42, 174, 164, 135, 84, 167, 225, 44, 194, 98, 113, 48, 179,
  ],
  [
    107, 172, 156, 211, 218, 218, 102, 226, 214, 221, 32, 38, 80, 129, 59, 221,
    150, 15, 232, 41, 214, 40, 80, 86, 13, 3, 99, 52, 130, 47, 152, 181,
  ],
  [
    59, 240, 174, 0, 183, 17, 86, 44, 157, 63, 2, 4, 43, 182, 204, 216, 194, 62,
    43, 150, 254, 148, 155, 134, 106, 249, 152, 24, 51, 5, 73, 188,
  ],
  [
    228, 20, 37, 24, 111, 152, 29, 44, 122, 209, 71, 100, 248, 90, 199, 222,
    231, 201, 111, 168, 56, 51, 49, 252, 22, 106, 110, 158, 153, 114, 252, 221,
  ],
];
