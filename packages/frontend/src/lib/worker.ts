// File that runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import * as Comlink from 'comlink';
import { WrapperCircuit } from './circuit/circuit_v3';

Comlink.expose(WrapperCircuit);
