const SETS = ['nouns-forker', 'large-contract-deployer', 'large-nft-trader'];

if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
  // Append the test sets
  SETS.forEach((set) => {
    SETS.push(`${set}.dev`);
  });
}

// NOTE: below maps should be in db in the future

// NOTE: placeholders
export const ROOT_TO_SET: { [key: string]: string } = {
  // Large contract deployer
  '86520291978624795409826466754796404277900417237047839256067126838468965580206':
    'large-contract-deployer',
  // Large contract deployer (dev)
  '43586171738911259590638859802512264024794694837033059618005748052121482475660':
    'large-contract-deployer.dev',
  // Large NFT trader
  '115506313796009276995072773495553577923872462746114834281855760647854325264663':
    'large-nft-trader',
  // Large NFT trader (dev)
  '68671494614999045282544969156783145684018586914629850691182214915143043900453':
    'large-nft-trader.dev',
  // Noun forker
  '77044991691308501276947077453618380236307246951439978663535817972735697388814': 'nouns-forker',
  // Noun forker (dev)
  '87114648479628679554879858936270603929868610217060348383220935508135278675371':
    'nouns-forker.dev',
};

export type SetMetadata = {
  count: number;
  duneURL: string;
  displayName: string;
  description: string;
};

export const SET_METADATA: { [key: string]: SetMetadata } = {
  'nouns-forker': {
    count: 141,
    duneURL: 'https://dune.com/queries/3037583',
    description: 'Joined Nouns Fork #0',
    displayName: 'Noun Fork 0 Member',
  },
  'large-contract-deployer': {
    count: 5152,
    duneURL: 'https://dune.com/queries/3028106',
    description: 'Deployed a contract with > 15k transactions',
    displayName: 'Large Contract Deployer',
  },
  'large-nft-trader': {
    count: 8708,
    duneURL: 'https://dune.com/queries/3036968',
    description: 'Made an NFT purchase > $150k',
    displayName: 'Large NFT Trader',
  },
};

if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
  // Append the test sets
  Object.keys(SET_METADATA).forEach((set) => {
    SET_METADATA[`${set}.dev`] = SET_METADATA[set];
  });
}

export default SETS;
