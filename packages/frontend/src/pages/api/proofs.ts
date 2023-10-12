// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Hex, hashMessage, keccak256 } from 'viem';
import prisma from '@/lib/prisma';
import { MembershipVerifier, PublicInput } from '@personaelabs/spartan-ecdsa';
import { ROOT_TO_SET } from '@/lib/sets';

const concatHex = (hex1: Hex, hex2: Hex): Hex => {
  return `0x${hex1.replace('0x', '')}${hex2.replace('0x', '')}`;
};

// We use a circuit with a smaller tree than the default circuit.
// The default circuit has 2^20 leaves and the circuit used here has 2^15 leaves.
// We use a smaller circuit to make the merkle tree construction faster.
const verifier = new MembershipVerifier({
  circuit: 'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.circuit',
  enableProfiler: true,
  useRemoteCircuit: true,
});
let verifiedInitialized = false;

// Merkle roots copied from json files
const VALID_ROOTS: bigint[] = Object.keys(ROOT_TO_SET).map((root) => BigInt(root));

export default async function submitProof(req: NextApiRequest, res: NextApiResponse) {
  const proof: Hex = req.body.proof;
  const publicInput: Hex = req.body.publicInput;
  // The signed message
  const message: string = req.body.message;

  // Convert submitted proof from hex to bytes
  const proofBytes = Buffer.from(proof.replace('0x', ''), 'hex');
  const publicInputBytes = Buffer.from(publicInput.replace('0x', ''), 'hex');

  if (!verifiedInitialized) {
    // Initialize the verifier's wasm
    await verifier.initWasm();
    verifiedInitialized = true;
  }

  // Verify the proof
  const verified = await verifier.verify(proofBytes, publicInputBytes);
  if (!verified) {
    res.status(400).send({ error: 'Invalid proof' });
    return;
  }

  const publicInputDeserialized = PublicInput.deserialize(publicInputBytes);
  const merkleRoot = publicInputDeserialized.circuitPubInput.merkleRoot;
  // Check if the merkle root is valid
  if (!VALID_ROOTS.includes(merkleRoot)) {
    res.status(400).send({ error: 'Invalid merkle root' });
    return;
  }

  // Convert merkle root to hex
  const merkleRootHex = `0x${merkleRoot.toString(16)}`;

  const msgHash = publicInputDeserialized.msgHash;
  // Check that the message hashes to msgHash
  if (msgHash.toString() !== Buffer.from(hashMessage(message, 'bytes')).toString()) {
    res.status(400).send({ error: 'Invalid message hash' });
    return;
  }

  // Compute the proof hash
  let proofHash: Hex = keccak256(concatHex(proof, publicInput));

  // Save the proof to the database. We save the proof the public input in hex format.
  await prisma.membershipProof.create({
    data: {
      message,
      proof,
      merkleRoot: merkleRootHex,
      publicInput,
      proofHash,
      proofVersion: 'v2', // We expect the submitted proof to be a V2 proof
    },
  });

  res.send({ proofHash });
}
