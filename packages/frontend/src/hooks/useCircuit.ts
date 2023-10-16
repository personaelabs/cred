import { useEffect, useMemo, useState } from 'react';
import { Hex, bytesToHex, hashMessage, hexToBytes, hexToSignature } from 'viem';
import { WrapperCircuit } from '../lib/circuit/circuit_v3';
import * as Comlink from 'comlink';
import { toPrefixedHex } from '@/lib/utils';
import { MerkleProof, WitnessInput } from '@/types';
import { MembershipProof } from '@prisma/client';

// Web worker to run proving and verification
let worker: Comlink.Remote<typeof WrapperCircuit>;

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
  let totalLength = 32 * arrays.length;

  // Create a new array with the total length
  let result = new Uint8Array(totalLength);

  // Copy each array into the result array
  let offset = 0;
  for (let array of arrays) {
    result.set(array, offset);
    offset += 32;
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
      worker = Comlink.wrap(new Worker(new URL('../lib/worker.ts', import.meta.url)));
      console.log('Preparing circuit');
      await worker.prepare();
    })();
  }, []);

  const prove = async (sig: Hex, message: string, merkleProof: MerkleProof): Promise<Hex> => {
    console.log('Proving');

    const { r, s, v } = hexToSignature(sig);

    if (!worker) {
      throw new Error('Circuit not initialized');
    }

    const sBytes = hexToBytes(s, {
      size: 32,
    });
    const rBytes = hexToBytes(r, {
      size: 32,
    });
    const isYOdd = !calculateSigRecovery(v);
    const msgHash = hashMessage(message, 'bytes');
    const siblings = concatUint8Arrays(
      merkleProof.siblings.map((sibling) => bigIntToBytes(sibling[0])),
    );

    const indices = concatUint8Arrays(
      merkleProof.pathIndices.map((index) =>
        hexToBytes(toPrefixedHex(index.toString(16)), {
          size: 32,
        }),
      ),
    );
    const root = bigIntToBytes(merkleProof.root);

    console.time('prove');
    let start = Date.now();

    const input: WitnessInput = {
      s: sBytes,
      r: rBytes,
      isYOdd,
      msgHash,
      siblings,
      indices,
      root,
    };

    const proof = await worker.prove(input);
    let end = Date.now();
    console.timeEnd('prove');
    window.alert('Proving took ' + (end - start) + 'ms');

    return bytesToHex(proof);
  };

  const verify = async (proof: MembershipProof): Promise<boolean> => {
    if (!worker) {
      throw new Error('Circuit not initialized');
    }
    const isVerified = await worker.verify(proof.proof as Hex);
    return isVerified;
  };

  // Get the message hash from the proof's public inputs
  const getMsgHash = async (proof: Hex) => {
    if (!worker) {
      throw new Error('Circuit not initialized');
    }
    const msgHash = await worker.getMsgHash(proof);
    return msgHash;
  };

  return { prove, verify, getMsgHash };
};
