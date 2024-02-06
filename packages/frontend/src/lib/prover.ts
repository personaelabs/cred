// This file runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import * as Comlink from 'comlink';
import { WitnessInput } from '@/app/types';

let circuit: any;

const Prover = {
  async prepare() {
    circuit = await import('circuit-web');

    circuit.init_panic_hook();
    circuit.prepare();
  },

  async prove(witness: WitnessInput) {
    const proof = await circuit.prove_membership(
      witness.s,
      witness.r,
      witness.isYOdd,
      witness.msgHash,
      witness.siblings,
      witness.indices,
      witness.root
    );
    return proof;
  },
};

Comlink.expose(Prover);
