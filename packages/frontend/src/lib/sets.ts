const SETS = ['nouns-forker', 'large-contract-deployer', 'large-nft-trader'];

if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
  // Append the test sets
  SETS.forEach((set) => {
    SETS.push(`${set}.dev`);
  });
}

// NOTE: below maps should be in db in the future

// NOTE: placeholders
export const handleToSet: { [key: string]: string } = {
  noun_null: 'nouns-forker',
  '0xlindhquist': 'large-contract-deployer',
  '0x_pixl': 'large-nft-trader',
};

// NOTE: placeholders
export const handleToProofHash: { [key: string]: string } = {
  noun_null: '0x1f88d2044653b3a2618a481cf06c9266b4d81ab93ea65abf38f4f1f486ba34de',
  '0xlindhquist': '0xad5d5172f69a582d6b5df24feb2d09c9d56d009d4d540ed1b309b8a538657376',
  '0x_pixl': '0x120c61dbbeb11fe81c6eab784018d31aca04c4c74b680deb54256c1457e9185e',
};

export type SetMetadata = {
  count: number;
  duneURL: string;
  displayName: string;
  description: string;
};

export const emptyMetadata = {
  count: 0,
  duneURL: '',
  displayName: '',
  description: '',
};

export const setMetadata: { [key: string]: SetMetadata } = {
  'nouns-forker': {
    count: 141,
    duneURL: 'https://dune.com/queries/3037583',
    description: 'Joined nouns fork 0',
    displayName: 'Noun Fork 0 Member',
  },
  'large-contract-deployer': {
    count: 5152,
    duneURL: 'https://dune.com/queries/3028106',
    description: 'Deployed a contract with > 15k total transactions',
    displayName: 'Large Contract Deployer',
  },
  'large-nft-trader': {
    count: 8708,
    duneURL: 'https://dune.com/queries/3036968',
    description: 'Has made an NFT purchase > $150k (priced at time of purchase)',
    displayName: 'Large NFT Trader',
  },
};

export default SETS;
