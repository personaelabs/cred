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
  '0xFork': 'nouns-forker',
  '0xDev': 'large-contract-deployer',
  '0xNFTrader': 'large-nft-trader',
};

// NOTE: placeholders
export const handleToProofHash: { [key: string]: string } = {
  '0xFork': '0x0',
  '0xDev': '0x0',
  '0xNFTrader': '0x0',
};

type SetMetadata = {
  count: number;
  duneURL: string;
  displayName: string;
};

export const setMetadata: { [key: string]: SetMetadata } = {
  'nouns-forker': {
    count: 141,
    duneURL: 'https://dune.com/queries/3037583',
    displayName: 'Nouns Forker',
  },
  'large-contract-deployer': {
    count: 5152,
    duneURL: 'https://dune.com/queries/3028106',
    displayName: 'Large Contract Deployer',
  },
  'large-nft-trader': {
    count: 8708,
    duneURL: 'https://dune.com/queries/3036968',
    displayName: 'Large NFT Trader',
  },
};

export default SETS;
