// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Hex,
  bytesToHex,
  hashMessage,
  hexToBytes,
  hexToSignature,
  keccak256,
  recoverAddress,
} from 'viem';
import prisma from '@/lib/prisma';
// @ts-ignore
import * as circuit from 'circuit-node/circuits_embedded';
import { ROOT_TO_SET, SET_METADATA } from '@/lib/sets';
import { toPrefixedHex } from '@/lib/utils';
import { SIG_MESSAGE, getFid } from '@/lib/fc';

let verifiedInitialized = false;

// Merkle roots copied from json files
const VALID_ROOTS: Hex[] = Object.keys(ROOT_TO_SET).map((root) =>
  toPrefixedHex(BigInt(root).toString(16)),
);

const TEST_PROOF: Hex = '0x';

export default async function submitProof(req: NextApiRequest, res: NextApiResponse) {
  const proof: Hex = req.body.proof;
  // The signature of the Farcaster account
  const fcAccountSig: Hex | undefined = req.body.fcAccountSig;
  // The signed message
  const message: string = req.body.message;

  // If we're not in production, we allow the TEST_PROOF to be submitted.
  // This is useful for testing the UI without having to generate a proof
  // every time.
  if (process.env.NODE_ENV !== 'production') {
    if (proof === TEST_PROOF) {
      const proofHash = keccak256(proof);
      res.send({ proofHash });
      return;
    }
  }

  if (!verifiedInitialized) {
    // Initialize the verifier's wasm
    circuit.prepare();
    circuit.init_panic_hook();
    verifiedInitialized = true;
  }

  // Verify the proof
  console.time('verify');
  const proofBytes = hexToBytes(proof);
  const verified = circuit.verify_membership(proofBytes);
  console.timeEnd('verify');
  if (!verified) {
    res.status(400).send({ error: 'Invalid proof' });
    return;
  }

  const merkleRoot = bytesToHex(circuit.get_root(proofBytes));
  // Check if the merkle root is valid
  if (!VALID_ROOTS.includes(merkleRoot)) {
    res.status(400).send({ error: 'Invalid merkle root' });
    return;
  }

  const msgHash = bytesToHex(circuit.get_msg_hash(proofBytes));
  // Check if the message hash is valid
  if (msgHash !== hashMessage(message)) {
    res.status(400).send({ error: 'Invalid message hash' });
    return;
  }

  // Verify the Farcaster account signature if it was provided
  let fcAddress;
  if (fcAccountSig) {
    const sigMessage = SIG_MESSAGE(
      SET_METADATA[ROOT_TO_SET[BigInt(merkleRoot).toString(10)]].displayName,
    );
    console.log({ sigMessage });
    try {
      fcAddress = await recoverAddress({
        hash: hashMessage(sigMessage),
        signature: fcAccountSig,
      });
    } catch {
      res.status(400).send({ error: 'Invalid Farcaster account signature' });
      return;
    }

    const s = hexToSignature(fcAccountSig).s;
    const sExpected = bytesToHex(circuit.get_fc_account_sig(proofBytes));

    // Check that the `fcAccountSig` is bonded to the proof
    if (s !== sExpected) {
      res
        .status(400)
        .send({ error: `Provided Farcaster account signature doesn't match the public input` });
      return;
    }
  }

  // Compute the proof hash
  let proofHash: Hex = keccak256(proof);

  // Get the FID if a Farcaster account signature was provided

  let fid: number | undefined;
  if (fcAddress) {
    const fidString = await getFid(fcAddress);

    if (fidString) {
      fid = parseInt(fidString);
    } else {
      res
        .status(400)
        .send({ error: `Farcaster account not found for recovery address ${fcAddress}` });
      return;
    }
  }

  console.log({ fid, fcAccountSig });
  console.log({ fcAddress });

  // Save the proof to the database. We save the proof the public input in hex format.
  await prisma.membershipProof.create({
    data: {
      message: message || '',
      proof,
      merkleRoot,
      publicInput: '',
      proofHash,
      proofVersion: 'v4', // We expect the submitted proof to be a V4 proof
      fcAccountSig: fcAccountSig,
      fid,
    },
  });

  res.send({ proofHash });
}
