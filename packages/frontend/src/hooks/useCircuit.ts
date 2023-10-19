import { useCallback, useEffect } from 'react';
import { Hex, bytesToHex, hashMessage, hexToBytes, hexToSignature } from 'viem';
import { WrappedCircuit } from '../lib/versionedCircuit';
import * as Comlink from 'comlink';
import { toPrefixedHex } from '@/lib/utils';
import { MerkleProof, WitnessInput } from '@/types';
import { MembershipProof } from '@prisma/client';

// Web worker to run proving and verification
let circuit: Comlink.Remote<typeof WrappedCircuit>;

// Copied from https://github.com/ethereumjs/ethereumjs-monorepo/blob/8ca49a1c346eb7aa61acf550f8fe213445ef71ab/packages/util/src/signature.ts#L46
// Returns if y is odd or not
function calculateSigRecovery(v: bigint, chainId?: bigint): boolean {
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
}

// Concatenates Uint8Arrays into a single Uint8Array
function concatUint8Arrays(arrays: Uint8Array[]) {
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
}

const bigIntToBytes = (x: bigint): Uint8Array => {
  let hex = x.toString(16);
  // Pad hex to be 32 bytes
  hex = hex.padStart(64, '0');

  return hexToBytes(toPrefixedHex(hex), {
    size: 32,
  });
};

export const useCircuit = () => {
  useEffect(() => {
    (async () => {
      // Initialize the web worker
      circuit = Comlink.wrap(new Worker(new URL('../lib/worker.ts', import.meta.url)));
      console.log('Preparing circuit');
      await circuit.prepare();
    })();
  }, []);

  const proveV4 = async (sig: Hex, message: string, merkleProofs: MerkleProof[]): Promise<Hex> => {
    console.log('Proving');
    console.log('merkleProofs', merkleProofs);
    const { r, s, v } = hexToSignature(sig);

    if (!circuit) {
      throw new Error('Circuit not initialized');
    }

    const sBytes = hexToBytes(s, {
      size: 32,
    });
    const rBytes = hexToBytes(r, {
      size: 32,
    });
    const isYOdd = calculateSigRecovery(v);
    const msgHash = hashMessage(message, 'bytes');
    const siblings = [];

    for (let i = 0; i < merkleProofs.length; i++) {
      const merkleProof = merkleProofs[i];
      const siblings_i = concatUint8Arrays(
        merkleProof.siblings.map((sibling) => bigIntToBytes(sibling[0])),
      );
      siblings.push(siblings_i);
    }

    const indices = [];
    for (let i = 0; i < merkleProofs.length; i++) {
      const merkleProof = merkleProofs[i];
      const pathIndices_i = concatUint8Arrays(
        merkleProof.pathIndices.map((index) => {
          if (index === 1) {
            let bytes = new Uint8Array(32);
            bytes[31] = 1;
            return bytes;
          }
          return new Uint8Array(32);
        }),
      );

      indices.push(pathIndices_i);
    }

    const roots = [];
    for (let i = 0; i < merkleProofs.length; i++) {
      const merkleProof = merkleProofs[i];
      const root_i = bigIntToBytes(merkleProof.root);
      roots.push(root_i);
    }

    console.time('prove');

    const input: WitnessInput = {
      s: sBytes,
      r: rBytes,
      isYOdd,
      msgHash,
      siblings: concatUint8Arrays(siblings),
      indices: concatUint8Arrays(indices),
      roots: concatUint8Arrays(roots),
    };

    const proof = await circuit.proveV4(input);
    console.timeEnd('prove');

    return bytesToHex(proof);
  };

  const verify = useCallback(async (proof: MembershipProof): Promise<boolean> => {
    if (!circuit) {
      throw new Error('Circuit not initialized');
    }
    const isVerified = await circuit.verify(proof);
    return isVerified;
  }, []);

  return { proveV4, verify };
};
