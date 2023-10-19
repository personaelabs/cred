import { WitnessInput } from '@/types';
import {
  MembershipVerifier,
  PublicInput,
  defaultAddressMembershipVConfig,
} from '@personaelabs/spartan-ecdsa';
import { Hex, bytesToHex, hashMessage, hexToBytes } from 'viem';
import { MembershipProof } from '@prisma/client';
import { Console } from 'console';

let v1Circuit: MembershipVerifier;
let v2Circuit: MembershipVerifier;
let v3Circuit: any;
let v4Circuit: any;

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

    // V3 circuit
    // We need to import the wasm package in run-time because
    // it only runs in browser environment.
    v3Circuit = await import('circuit-web-v3');
    v3Circuit.init_panic_hook();

    //V4 circuit
    v4Circuit = await import('circuit-web-v4');
    v4Circuit.init_panic_hook();

    if (!initialized) {
      v3Circuit.prepare();
      v4Circuit.prepare();
      initialized = true;
    }
  },

  async proveV4(input: WitnessInput): Promise<Uint8Array> {
    const proof = await v4Circuit.prove_membership(
      input.s,
      input.r,
      input.isYOdd,
      input.msgHash,
      input.siblings,
      input.indices,
      input.roots,
    );

    return proof;
  },

  verifyMerkleRoot(proof: MembershipProof): boolean {
    let rootsInProof: Hex[] = [];
    const proofBytes = hexToBytes(proof.proof as Hex);
    if (proof.proofVersion === 'v1' || proof.proofVersion === 'v2') {
      const pubInput = PublicInput.deserialize(hexToBytes(proof.publicInput as Hex));
      rootsInProof = [`0x${pubInput.circuitPubInput.merkleRoot.toString(16)}`];
    } else if (proof.proofVersion === 'v3') {
      rootsInProof = [bytesToHex(v3Circuit.get_root(proofBytes))];
    } else if (proof.proofVersion === 'v4') {
      const rootsBytes = v4Circuit.get_roots(proofBytes);
      for (let i = 0; i < rootsBytes.length / 32; i++) {
        const rootBytes = rootsBytes.slice(i * 32, (i + 1) * 32);
        const merkleRoot = bytesToHex(rootBytes);
        rootsInProof.push(merkleRoot);
      }
    } else {
      throw new Error(`Unknown proof version ${proof.proofVersion}`);
    }

    const claimedRoots = (proof.merkleRoot as Hex).split(',');
    console.log('claimed roots', claimedRoots);
    console.log('rootsInProof', rootsInProof);

    const unprovenRoots = claimedRoots.filter((claimedRoot) => {
      return !rootsInProof.includes(claimedRoot as Hex);
    });

    // Log if there are unproven roots
    if (unprovenRoots.length > 0) {
      console.log('unproven roots', unprovenRoots);
    }

    // Return if the claimed roots are in the proof
    return unprovenRoots.length === 0;
  },

  verifyMsgHash(proof: MembershipProof): boolean {
    let msgHash;
    const proofBytes = hexToBytes(proof.proof as Hex);
    if (proof.proofVersion === 'v1' || proof.proofHash === 'v2') {
      const pubInput = PublicInput.deserialize(hexToBytes(proof.publicInput as Hex));
      msgHash = bytesToHex(pubInput.msgHash);
    } else if (proof.proofVersion === 'v3') {
      msgHash = bytesToHex(v3Circuit.get_msg_hash(proofBytes));
    } else if (proof.proofVersion === 'v4') {
      msgHash = bytesToHex(v4Circuit.get_msg_hash(proofBytes));
    }

    return msgHash === hashMessage(proof.message);
  },

  async verify(proof: MembershipProof): Promise<boolean> {
    const proofBytes = hexToBytes(proof.proof as Hex);
    const publicInputBytes = hexToBytes(proof.publicInput as Hex);

    await this.prepare();

    let verified: boolean;
    verified = this.verifyMsgHash(proof) && this.verifyMerkleRoot(proof);

    if (proof.proofVersion === 'v1') {
      verified = await v1Circuit.verify(proofBytes, publicInputBytes);
    } else if (proof.proofVersion === 'v2') {
      verified = await v2Circuit.verify(proofBytes, publicInputBytes);
    } else if (proof.proofVersion === 'v3') {
      verified = await v3Circuit.verify_membership(proofBytes);
    } else if (proof.proofVersion === 'v4') {
      verified = await v4Circuit.verify_membership(proofBytes);
    } else {
      throw new Error(`Unknown proof version`);
    }

    console.log('verified', verified);

    return verified;
  },
};

export const WrappedCircuit = VersionedCircuit;
