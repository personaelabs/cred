const SETS = [
  'nouns-forker',
  'large-contract-deployer',
  'medium-nft-trader',
  'beacon-genesis-staker',
  'stateful-book-funder',
];

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
  '12059175724921248783816634079249782645899641663869708221275165002968886136761':
    'large-contract-deployer.dev',
  // Medium NFT trader
  '115506313796009276995072773495553577923872462746114834281855760647854325264663':
    'medium-nft-trader',
  // Medium NFT trader (dev)
  '38696628166924307776997624352708928059356320961096744665751848091027025393914':
    'medium-nft-trader.dev',
  // Noun forker
  '77044991691308501276947077453618380236307246951439978663535817972735697388814': 'nouns-forker',
  // Noun forker (dev)
  '110918350114610035587848500718544429428834041282602854525299570336150405151205':
    'nouns-forker.dev',
  // Beacon genesis depositor
  '72157638181807266957086961040251077246497044206384217064091112703078373626008':
    'beacon-genesis-staker',
  // Beacon genesis depositor (dev)
  '50777731812771869834226667887628150367101335181345852537964298579214415605348':
    'beacon-genesis-staker.dev',
  // Stateful Book funder
  '6690976376652039843228206295576365750228117387661294120304573887453254943085':
    'stateful-book-funder',
  // Stateful Book funder (dev)
  '88250032628225067653553032155206207715967121794154946393982605502187531422469':
    'stateful-book-funder.dev',
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
  'medium-nft-trader': {
    count: 8708,
    duneURL: 'https://dune.com/queries/3036968',
    description: 'Made >=1 NFT purchase over $150k',
    displayName: 'Large NFT Trader',
  },
  'beacon-genesis-staker': {
    count: 2780,
    duneURL: 'https://dune.com/queries/3068965',
    description: 'Was a beacon chain genesis staker',
    displayName: 'Beacon Chain Genesis Staker',
  },
  'stateful-book-funder': {
    count: 201,
    duneURL: 'https://dune.com/queries/3074856',
    description: 'Purchased a Stateful works Beacon Book Genesis Edition',
    displayName: 'Stateful Book Genesis Funder',
  },
};

if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
  // Append the test sets
  Object.keys(SET_METADATA).forEach((set) => {
    SET_METADATA[`${set}.dev`] = SET_METADATA[set];
  });
}

export default SETS;
