// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
// import { CircuitV3 } from '../../lib/circuit/circuit_v3';
// @ts-ignore
import * as circuit from 'circuits/circuits_bg';
import * as wasm from 'circuits/circuits_bg.wasm';

let verifiedInitialized = false;

export default async function submitProof(req: NextApiRequest, res: NextApiResponse) {
  circuit.__wbg_set_wasm(wasm);

  circuit.init_panic_hook();
  res.send('Hello');
}
