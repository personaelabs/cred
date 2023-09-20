import 'dotenv/config';
import { Tree, Poseidon, MerkleProof } from '@personaelabs/spartan-ecdsa';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { DEV_ACCOUNTS } from './dev-accounts';

export type Hex = `0x${string}`;

// Append the "0x" prefix to the string if it doesn't have it
const toPrefixedHex = (str: string): Hex => {
  return (str.startsWith('0x') ? str : '0x' + str) as Hex;
};

const hexToBigint = (hex: Hex): bigint => {
  return BigInt(hex);
};

const bigIntToHex = (bigInt: bigint): Hex => {
  return `0x${bigInt.toString(16)}` as Hex;
};

const saveMerkleProofs = async (
  csvFileName: string,
  outFileName: string,
  includeDevAccounts: boolean,
) => {
  // Setup the poseidon hasher
  const poseidon = new Poseidon();
  await poseidon.initWasm();

  // Initialize the Merkle tree
  const depth = 20;
  const tree = new Tree(depth, poseidon);

  // Read all addresses onto memory
  const addresses: bigint[] = [];

  if (includeDevAccounts) {
    // Include the dev accounts
    DEV_ACCOUNTS.forEach((address) => {
      addresses.push(hexToBigint(address));
    });
  }

  // Read the addresses from the csv file
  fs.createReadStream(csvFileName)
    .pipe(
      parse({
        delimiter: ',',
        skip_empty_lines: true,
      }),
    )
    .on('data', (row) => {
      // Insert the address into the Merkle tree
      const address = row[0];
      addresses.push(hexToBigint(toPrefixedHex(address)));
    })
    .on('end', () => {
      // Create the Merkle tree and save the proofs

      // Insert all addresses into the Merkle tree
      addresses.forEach((address) => {
        tree.insert(address);
      });

      const merkleProofs: {
        address: Hex;
        merkleProof: MerkleProof;
      }[] = [];

      // Create the merkle proofs for all addresses
      addresses.forEach((address) => {
        const index = tree.indexOf(address);
        const merkleProof = tree.createProof(index);
        merkleProofs.push({ address: bigIntToHex(address), merkleProof });
      });

      // Save the merkle proofs into a JSON file
      fs.writeFileSync(
        path.join(__dirname, `../merkle-proofs/${outFileName}.json`),
        JSON.stringify(merkleProofs, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
      );
    });
};

const csvFiles = fs.readdirSync(path.join(__dirname, '../sets'));

csvFiles.forEach((csvFile) => {
  const fileName = csvFile.split('.')[0];

  // Save the merkle proofs for the tree that includes the dev accounts
  saveMerkleProofs(path.join(__dirname, `../sets/${csvFile}`), `${fileName}.dev.`, true);

  // Save the merkle proofs for the tree that doesn't include the dev accounts
  saveMerkleProofs(path.join(__dirname, `../sets/${csvFile}`), fileName, false);
});
