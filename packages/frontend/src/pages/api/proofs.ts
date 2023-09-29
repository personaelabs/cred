// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Hex, hashMessage, keccak256 } from 'viem';
import prisma from '@/lib/prisma';
import {
  MembershipVerifier,
  PublicInput,
  defaultAddressMembershipVConfig,
} from '@personaelabs/spartan-ecdsa';

const concatHex = (hex1: Hex, hex2: Hex): Hex => {
  return `0x${hex1.replace('0x', '')}${hex2.replace('0x', '')}`;
};

const verifier = new MembershipVerifier({
  ...defaultAddressMembershipVConfig,
  useRemoteCircuit: true,
});
let verifiedInitialized = false;

// Copied-pasted Merkle roots (from the JSON files)
const VALID_ROOTS: bigint[] = [
  // Large contract deployer
  '86520291978624795409826466754796404277900417237047839256067126838468965580206',
  // Large contract deployer (dev)
  '43586171738911259590638859802512264024794694837033059618005748052121482475660',
  // Large NFT trader
  '115506313796009276995072773495553577923872462746114834281855760647854325264663',
  // Large NFT trader (dev)
  '68671494614999045282544969156783145684018586914629850691182214915143043900453',
  // Noun forker
  '77044991691308501276947077453618380236307246951439978663535817972735697388814',
  // Noun forker (dev)
  '87114648479628679554879858936270603929868610217060348383220935508135278675371',
].map((root) => BigInt(root));

export default async function submitProof(req: NextApiRequest, res: NextApiResponse) {
  const proof: Hex = req.body.proof;
  const publicInput: Hex = req.body.publicInput;
  // The signed message
  const message: string = req.body.message;

  // Convert submitted proof from hex to bytes
  const proofBytes = Buffer.from(proof.replace('0x', ''), 'hex');
  const publicInputBytes = Buffer.from(publicInput.replace('0x', ''), 'hex');

  // if (!verifiedInitialized) {
  //   // Initialize the verifier's wasm
  //   await verifier.initWasm();
  //   verifiedInitialized = true;
  // }

  // // Verify the proof
  // const verified = await verifier.verify(proofBytes, publicInputBytes);
  // if (!verified) {
  //   res.status(400).send({ error: 'Invalid proof' });
  //   return;
  // }

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
    },
  });

  res.send({ proofHash });
}
