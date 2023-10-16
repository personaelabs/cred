import { WitnessInput } from '@/types';
import { MembershipVerifier, defaultAddressMembershipVConfig } from '@personaelabs/spartan-ecdsa';
import { Hex, bytesToHex, hexToBytes } from 'viem';
import { MembershipProof } from '@prisma/client';

let v1Circuit: MembershipVerifier;
let v2Circuit: MembershipVerifier;
let v3Circuit: any;

let initialized = false;
export const VersionedCircuit = {
  async prepare() {
    v1Circuit = new MembershipVerifier({
      ...defaultAddressMembershipVConfig,
      enableProfiler: true,
      useRemoteCircuit: true,
    });

    // Initialize the wasm module
    await v1Circuit.initWasm();

    // In V2, we use a circuit with a smaller tree than the default circuit.
    // The default circuit has 2^20 leaves and the circuit used here has 2^15 leaves.
    // We use a smaller circuit to make the merkle tree construction faster.
    v2Circuit = new MembershipVerifier({
      circuit:
        'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.circuit',
      enableProfiler: true,
      useRemoteCircuit: true,
    });

    // Initialize the wasm module
    await v2Circuit.initWasm();

    // V3 verifier
    // We need to import the wasm package in run-time because
    // it only runs in browser environment.
    // @ts-ignore
    v3Circuit = await import('circuit-web');
    v3Circuit.init_panic_hook();

    if (!initialized) {
      v3Circuit.client_prepare();
      initialized = true;
    }
  },

  async prove(input: WitnessInput): Promise<Uint8Array> {
    const proof = await v3Circuit.prove_membership(
      input.s,
      input.r,
      input.isYOdd,
      input.msgHash,
      input.siblings,
      input.indices,
      input.root,
    );

    return proof;
  },

  async verify(proof: MembershipProof): Promise<boolean> {
    const proofBytes = hexToBytes(proof.proof as Hex);
    const publicInputBytes = hexToBytes(proof.publicInput as Hex);

    console.log('proof versoin', proof.proofVersion);
    await this.prepare();

    let verified: boolean;
    if (proof.proofVersion === 'v1') {
      verified = await v1Circuit.verify(proofBytes, publicInputBytes);
    } else if (proof.proofVersion === 'v2') {
      verified = await v2Circuit.verify(proofBytes, publicInputBytes);
    } else if (proof.proofVersion === 'v3') {
      verified = await v3Circuit.verify_membership(proofBytes);
    } else {
      throw new Error(`Unknown proof version`);
    }

    return verified;
  },

  // Get the merkle root from the proof's public input
  getMerkleRoot(proof: MembershipProof): Hex {
    const proofBytes = hexToBytes(proof.proof as Hex);
    const result = v3Circuit.get_root(proofBytes);
    return bytesToHex(result);
  },

  // Get the message hash from the proof's public input
  getMsgHash(proof: MembershipProof): Hex {
    const proofBytes = hexToBytes(proof.proof as Hex);
    const result = v3Circuit.get_msg_hash(proofBytes);
    return bytesToHex(result);
  },
};

export const WrappedCircuit = VersionedCircuit;
