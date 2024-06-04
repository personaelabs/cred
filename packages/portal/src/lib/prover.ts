// This file runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import * as Comlink from 'comlink';
import { WitnessInput } from '@/types';

let circuit: any;
let circuitInitialized = false;

const Prover = {
  async prepare() {
    circuit = await import('circuit-web');

    if (!circuitInitialized) {
      circuit.init_panic_hook();
      circuit.prepare();
      circuitInitialized = true;
    }
  },

  async prove(witness: WitnessInput) {
    const proof = await circuit.prove_membership(
      witness.s,
      witness.r,
      witness.isYOdd,
      witness.msgHash,
      witness.siblings,
      witness.indices,
      witness.root,
      witness.signInSigS
    );
    return proof;
  },
};

Comlink.expose(Prover);
