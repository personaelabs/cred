'use client';

import * as Comlink from 'comlink';
import { useEffect } from 'react';
import { FidAttestationRequestBody, WitnessInput } from '@/app/types';
import { WalletClient } from 'viem';
import {
  calculateSigRecovery,
  concatUint8Arrays,
  fromHexString,
  captureFetchError,
  toHexString,
} from '@/lib/utils';
import {
  Hex,
  hashMessage,
  hexToBytes,
  hexToCompactSignature,
  hexToSignature,
} from 'viem';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { MerkleTree } from '@/proto/merkle_tree_pb';
import { PRECOMPUTED_HASHES } from '@/lib/utils';

interface Prover {
  prepare(): Promise<void>;
  prove(_witness: WitnessInput): Promise<Uint8Array>;
}

const getMerkleTree = async (
  groupId: number
): Promise<{
  treeId: number;
  merkleTree: MerkleTree;
}> => {
  const response = await fetch(`/api/groups/${groupId}/merkle-tree`);

  if (!response.ok) {
    await captureFetchError(response);
    throw new Error('Failed to fetch merkle tree');
  }

  const responseBuf = await response.arrayBuffer();

  const treeId = Buffer.from(responseBuf.slice(0, 4)).readUInt32BE();
  const merkleTreeBytes = responseBuf.slice(4, responseBuf.byteLength);

  const merkleTree = MerkleTree.deserializeBinary(
    new Uint8Array(merkleTreeBytes)
  );

  return { treeId, merkleTree };
};

const getMerkleProof = (merkleTree: MerkleTree, address: Hex) => {
  const layers = merkleTree.getLayersList();
  const treeDepth = layers.length;

  // Get the leaves of the tree
  const leaves = layers[0].getNodesList();

  // Convert the address to a buffer
  const addressBuffer = fromHexString(address, 20);

  // Find the leaf index
  let leafIndex = leaves.findIndex(leaf => {
    const leafBytes = leaf.getNode_asU8();
    return addressBuffer.equals(Buffer.from(leafBytes));
  });

  if (leafIndex === -1) {
    return null;
  }

  // Get the merkle proof
  const siblings = [];
  const pathIndices = [];

  for (let i = 0; i < treeDepth - 1; i++) {
    const layer = layers[i];
    const siblingIndex = leafIndex % 2 === 0 ? leafIndex + 1 : leafIndex - 1;

    const sibling =
      (layer
        .getNodesList()
        .find(node => node.getIndex() === siblingIndex)
        ?.getNode() as Uint8Array) || PRECOMPUTED_HASHES[i];

    siblings.push(sibling);
    pathIndices.push(leafIndex & 1);

    leafIndex = Math.floor(leafIndex / 2);
  }

  const root = layers[treeDepth - 1].getNodesList()[0].getNode_asU8();

  return {
    root,
    path: siblings.map(sibling => toHexString(sibling)),
    pathIndices,
  };
};

const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

let prover: Comlink.Remote<Prover>;
const useProver = () => {
  const { user, siwfResponse } = useUser();

  useEffect(() => {
    prover = Comlink.wrap<Prover>(
      new Worker(new URL('../lib/prover.ts', import.meta.url))
    );
  }, []);

  const prove = async (
    address: Hex,
    client: WalletClient,
    groupId: number
  ): Promise<FidAttestationRequestBody | null> => {
    if (prover && user?.fid && siwfResponse) {
      const message = `\n${SIG_SALT}Personae attest:${user?.fid}`;

      await prover.prepare();

      // Sign message with the source key
      const sig = await client.signMessage({
        message,
        account: address,
      });

      toast('Adding creddd...', {
        description: 'This may take a minute...',
      });

      const { treeId, merkleTree } = await getMerkleTree(groupId);

      const { s, r, v } = hexToSignature(sig);
      const isYOdd = calculateSigRecovery(v);

      const msgHash = hashMessage(message);

      const merkleProof = getMerkleProof(merkleTree, address);

      if (!merkleProof) {
        throw new Error('Merkle proof not found');
      }

      if (!siwfResponse.signature) {
        throw new Error('SIWF response signature not found');
      }

      const { yParityAndS: signInSigS } = hexToCompactSignature(
        siwfResponse.signature
      );

      // Construct the witness
      const witness: WitnessInput = {
        s: hexToBytes(s),
        r: hexToBytes(r),
        isYOdd,
        msgHash: hexToBytes(msgHash),
        siblings: concatUint8Arrays(
          merkleProof.path.map(path => fromHexString(path as Hex, 32))
        ),
        indices: concatUint8Arrays(
          merkleProof.pathIndices.map(index => {
            const buf = new Uint8Array(32);
            if (index === 1) {
              buf[31] = 1;
            }
            return buf;
          })
        ),
        root: merkleProof.root,
        signInSigS: hexToBytes(signInSigS),
      };

      const proof = await prover.prove(witness);

      if (proof) {
        // Extract the `issuedAt` from the SIWF message
        const issuedAt = siwfResponse.message?.match(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
        );

        if (!issuedAt || issuedAt.length === 0) {
          throw new Error('Could not extract `issuedAt` from SIWF message');
        }

        return {
          proof: toHexString(proof),
          signInSig: siwfResponse.signature,
          custody: siwfResponse.custody!,
          signInSigNonce: siwfResponse.nonce,
          fid: user.fid,
          treeId,
          issuedAt: issuedAt[0],
        };
      }

      return null;
    } else {
      console.error('Not ready to prove');
    }

    return null;
  };

  return { prove };
};

export default useProver;
