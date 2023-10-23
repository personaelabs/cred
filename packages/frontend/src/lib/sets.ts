import { Hex } from 'viem';

// NOTE: order in this array determines the order in the UI
const SETS = [
  'eth-presale',
  'protocol-guild',

  'beacon-genesis-staker',

  'first-10-genesis-beacon-staker',
  'first-100-genesis-beacon-staker',
  'first-500-genesis-beacon-staker',

  'stateful-book-funder',

  'large-contract-deployer',

  'medium-nft-trader',

  'nouns-forker',
];

if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
  // Append the test sets
  SETS.forEach((set) => {
    SETS.push(`${set}.dev`);
  });
}

// NOTE: below maps should be in db in the future

// NOTE: placeholders
export const ROOT_TO_SET: { [key: Hex]: string } = {
  // ############################
  // V1 Merkle trees
  // ############################

  '0xbf48bff7a9f3291f51d73af135b01d6d4977ba1cc9fdb845d0c809ae4cb83dae': 'large-contract-deployer',
  '0x1aa94067b60301ff566069763e911b8b867c02cd13f5c86ab23a4777ffe3cfb9':
    'large-contract-deployer.dev',
  '0xff5e41bfc0fee9a987bf55ab7ce0b7c99a791f52f627f40aaac2d15742d47117': 'medium-nft-trader',
  '0x558d83f01381af62492c6decf50d66eec4918d7b1127a52a2df91a60370778fa': 'medium-nft-trader.dev',
  '0xaa55eb829c5218b94d6087f5cfa41a9626d9a198e49ea2ced7ba2a07978e850e': 'nouns-forker',
  '0xf5398fb8b12f08f9239728e227b43b1d30eaeb24918f2c75aed9bd08356279e5': 'nouns-forker.dev',
  '0x9f87c6a1a15ff3bf418477d79a3b1d620b5b86b14e426a451779543f69199098': 'beacon-genesis-staker',
  '0x70432d7f9432a33c38b35cb32aa70f90e680cddb646f25feec3b513ebabeae64': 'beacon-genesis-staker.dev',
  '0xecaf55b4dc722e340c85e93644cbf0306b5e00a01406f153abc29caf010816d': 'stateful-book-funder',
  '0xc31bbf963ad2e41d94153637187910b348f8ab0e0228bbfc6401aae3edc04b05': 'stateful-book-funder.dev',

  // ############################
  // V2~V4 Merkle trees
  // ############################

  '0xa9038fe61cf61b26905aa24c9cc004651a823c95c38467746a81bbea91ae5cd3': 'stateful-book-funder',
  '0x39526aab27d3f721108528e63e6a4cb2bef82b1346e0d0cf4b6c2a40272c7b55': 'stateful-book-funder.dev',
  '0x34207f1edb5e542603592e42241840168edabe7b174aeed49670d6ab9a1b04ee': 'eth-presale',
  '0x069c38d3dc4a1ee9a5d9e3042dcfaefecabdccbf60889d8ebe375a33f558f882': 'eth-presale.dev',
  '0xa8a2174164a7b872d03dda96e4c02fb015bece36b7c5e5505ffc8b409f2c3300': 'beacon-genesis-staker',
  '0x6ce352a645e688bac3d713ad9ef394f8914c826dddd2eca39a5cf8aeaa06e1f1': 'beacon-genesis-staker.dev',
  '0x7d62d52d8cd6ed5ea7a340200ec3b53825f49bcd6e1c8df81b5b1ae55104caa5': 'large-contract-deployer',
  '0xcac5d911763ac0acc76e1f6dc13c812e8266df4d2defdc3e6fab40588300b5c2':
    'large-contract-deployer.dev',
  '0x66d4d5f426f35f3f7cf29ca287acb203556d906529d2746b8295a00d60df8980':
    'first-500-genesis-beacon-staker',
  '0x340b07fa8c63ecb7119d6aefe4ecf12ee74e23aded44885ff15ed10bf3995d2f':
    'first-500-genesis-beacon-staker.dev',
  '0xac9ecd35b267bb49e98cb15fd76912f9a751acf474762c88dedf598e1438eedc': 'nouns-forker',
  '0xbff27a965b4d393f9c7f2da565d34daa5b8f837818a006e953c70e35f953f579': 'nouns-forker.dev',
  '0xbad1b783ad4f34477fbf8deab291c70c91b6563987d0e974b8ee1b0ee30ba6d1':
    'first-10-genesis-beacon-staker',
  '0xcba1c843ff43867f40ba0d2602d3c6816ed8c140d8e3c8c59acfec1ecd9810ad':
    'first-10-genesis-beacon-staker.dev',
  '0x3aa662f0bc0bcc70c65732923d3a59ad493929f7f92c780ca57b816b9bbe049f': 'medium-nft-trader',
  '0x48b921fc192d9e9d1a5cecb66e8bb82be003762673bf9334e54c2505f0a2aa87': 'medium-nft-trader.dev',
  '0xa4d0269b99ab1ddfaaa618900da514c35d705f22377153ccbfa2c56ce5a5a9a3': 'protocol-guild',
  '0x413506feafd63888b31ce0bfb8dd726959485f72ae17f18a512087ffe0eca76d': 'protocol-guild.dev',
  '0x870773574daa09011b5e552b69aa450b0c4dd724a06369f20236d12b93b2f087':
    'first-100-genesis-beacon-staker',
  '0x74fc8452474440e0852b596af6d9dd248245846bc6278dbf7f1eb0ecf1dca0bd':
    'first-100-genesis-beacon-staker.dev',
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

  'first-10-genesis-beacon-staker': {
    count: 10,
    duneURL: 'https://dune.com/queries/3115358',
    description: 'Was one of the first 10 beacon chain genesis stakers',
    displayName: 'First 10 Beacon Chain Genesis Staker',
  },
  'first-100-genesis-beacon-staker': {
    count: 100,
    duneURL: 'https://dune.com/queries/3115461',
    description: 'Was one of the first 100 beacon chain genesis stakers',
    displayName: 'First 100 Beacon Chain Genesis Staker',
  },
  'first-500-genesis-beacon-staker': {
    count: 500,
    duneURL: 'https://dune.com/queries/3115466',
    description: 'Was one of the first 500 beacon chain genesis stakers',
    displayName: 'First 500 Beacon Chain Genesis Staker',
  },
  'protocol-guild': {
    count: 152,
    duneURL: 'https://app.splits.org/accounts/0x84af3D5824F0390b9510440B6ABB5CC02BB68ea1/',
    description: 'Protocol Guild ',
    displayName: 'Protocol Guild (snapshot block: 18387780)',
  },

  'eth-presale': {
    count: 8893,
    duneURL: 'https://dune.com/queries/3124962',
    description: 'Participated in the Ethereum Pre-sale',
    displayName: 'Ethereum Pre-sale',
  },
};

if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
  // Append the test sets
  Object.keys(SET_METADATA).forEach((set) => {
    SET_METADATA[`${set}.dev`] = SET_METADATA[set];
  });
}

export default SETS;
