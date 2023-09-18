const wasm_tester = require('circom_tester').wasm;
import * as path from 'path';
import { Poseidon, computeEffEcdsaPubInput } from '@personaelabs/spartan-ecdsa';
import { ecsign, hashPersonalMessage, privateToPublic } from '@ethereumjs/util';
import { constructTree, bytesToBigInt, CircuitInput, deepCopy } from './test_utils';

// process.env.CI is set to true in GitHub Actions
const maybe = process.env.CI ? describe.skip : describe;

maybe('nym ownership', () => {
  let circuitInput: CircuitInput;
  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm_tester(path.join(__dirname, '../circom/pubkey_membership.circom'), {
      prime: 'secq256k1', // Specify to use the option --prime secq256k1 when compiling with circom
    });

    // Init the Poseidon hash function
    const poseidon = new Poseidon();
    await poseidon.initWasm();

    // Sign a message
    const msg = Buffer.from('harry potter', 'utf8');
    const privKey = Buffer.from(''.padStart(16, '🧙'), 'utf16le');
    const nymMsgHash = hashPersonalMessage(msg);
    const sig = ecsign(nymMsgHash, privKey);

    // Compute the efficient ECDSA signature input (T and U)
    const sigEffECDSAInput = computeEffEcdsaPubInput(
      bytesToBigInt(sig.r),
      sig.v,
      nymMsgHash,
    );

    // Construct the Merkle tree and create a Merkle proof

    const privKeys = [
      Buffer.from(''.padStart(16, '🧙'), 'utf16le'),
      Buffer.from(''.padStart(16, '🪄'), 'utf16le'),
      Buffer.from(''.padStart(16, '🔮'), 'utf16le'),
    ];

    const tree = await constructTree(privKeys, poseidon);
    const proverPubKey = poseidon.hashPubKey(privateToPublic(privKey));
    const merkleProof = tree.createProof(tree.indexOf(proverPubKey));

    // ########################
    // Prepare the input
    // ########################

    const Tx = sigEffECDSAInput.Tx;
    const Ty = sigEffECDSAInput.Ty;
    const Ux = sigEffECDSAInput.Ux;
    const Uy = sigEffECDSAInput.Uy;

    circuitInput = {
      // Efficient ECDSA signature
      Tx,
      Ty,
      Ux,
      Uy,
      s: bytesToBigInt(sig.s),

      // Merkle proof
      siblings: merkleProof.siblings.map((sibling) => sibling[0]),
      pathIndices: merkleProof.pathIndices,
      root: tree.root(),
    };
  });

  it('should pass when both signatures and the Merkle proof are valid', async () => {
    const w = await circuit.calculateWitness(circuitInput, true);
    await circuit.checkConstraints(w);
  });

  // Check that the circuit fails when any of the inputs is invalid
  [
    'sigTx',
    'sigTy',
    'sigUx',
    'sigUy',
    'siblings',
    'pathIndices',
    'root',
  ].forEach((key) => {
    it.failing(`should fail when ${key} is invalid`, async () => {
      const invalidCircuitInput = deepCopy(circuitInput);
      if (key === 'siblings') {
        invalidCircuitInput.siblings[0] += BigInt(1);
      } else if (key === 'pathIndices') {
        invalidCircuitInput.pathIndices[0] += 1;
      } else {
        (invalidCircuitInput[key] as bigint) += BigInt(1);
      }

      const w = await circuit.calculateWitness(
        {
          ...invalidCircuitInput,
        },
        true,
      );
      circuit.checkConstraints(w);
    });
  });
});
