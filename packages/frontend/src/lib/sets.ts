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
  '76447165105331665609740755981648466157088920231561614510149787304683998436563':
    'stateful-book-funder',
  '25927450028016028396544966666307155413136560540792190076019509810979056417621':
    'stateful-book-funder.dev',
  '76274948289645586435289340853422471763754237740110973343819762426682419196672':
    'beacon-genesis-staker',
  '49251432356610431113464536990917573663953726846265838572910547935570392703473':
    'beacon-genesis-staker.dev',
  '56713728385258183388719405085479047414811699021446377619340743361764796975781':
    'large-contract-deployer',
  '91716762435308518907869055015877397543063756079012033620790740721176986826178':
    'large-contract-deployer.dev',
  '78078388098223329569569772278322489830468968638717513634539168975843432656604': 'nouns-forker',
  '86820177135741744207772468260986442655835013809591378103429892787603296744825':
    'nouns-forker.dev',
  '26528124691915412410249453354377614861514014901374401720189705783607073571999':
    'medium-nft-trader',
  '32893626359166759374764640345024293163603595235417547827182497770539418036871':
    'medium-nft-trader.dev',
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
