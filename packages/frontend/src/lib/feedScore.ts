import { filterActive } from './neynar';
import { getSuggestedFollows } from './score';

const MAX_NEYNAR_QUERIES = 20; // NOTE: to ensure that this query doesn't run forever
const NEYNAR_CHUNK_SIZE = 99;

export async function getActiveSuggestedFollows(
  followingFids: number[],
  take: number = 3
) {
  let ret: any[] = [];

  const allSuggested = await getSuggestedFollows(followingFids);

  let numIterations = 0;
  for (let i = 0; i < allSuggested.length; i += NEYNAR_CHUNK_SIZE) {
    const slice = allSuggested.slice(i, i + NEYNAR_CHUNK_SIZE);
    const activeFids = await filterActive(slice.map(({ fid }) => fid));

    ret = ret.concat(slice.filter(({ fid }) => activeFids.includes(fid)));

    numIterations++;

    if (ret.length >= take || numIterations > MAX_NEYNAR_QUERIES) {
      break;
    }
  }

  if (ret.length === 0) {
    return allSuggested.slice(0, take);
  } else {
    return ret.slice(0, take);
  }
}

export enum FeedScoreCategory {
  // eslint-disable-next-line no-unused-vars
  OFFCHAIN,
  // eslint-disable-next-line no-unused-vars
  MID,
  // eslint-disable-next-line no-unused-vars
  DEGENERATE,
  // eslint-disable-next-line no-unused-vars
  ELITE,
}

export type FeedScoreFrameInfo = {
  color: string;
  label: string;
  msg: string;
};

export const categoryToFrameInfo = {
  [FeedScoreCategory.OFFCHAIN]: {
    color: '#888',
    label: 'offchain',
    msg: "they're mostly normies. you might be a normie yourself.",
  },
  [FeedScoreCategory.MID]: {
    color: '#aaa',
    label: 'mid',
    msg: "they tinker, but they're usually pretty midcurve.",
  },
  [FeedScoreCategory.DEGENERATE]: {
    color: '#ccc',
    label: 'degenerate',
    msg: "they're usually ahead of the curve.",
  },
  [FeedScoreCategory.ELITE]: {
    color: '#fff',
    label: 'elite',
    msg: "you follow insiders and whales. you're probably already rich.",
  },
};

// TODO: set these based on actual user distributions. maximize the chance few elites, few degens
// feed score breakpoints for each category
const scoreBreakpoints = [
  5000, // mid
  10000, // degenerate
  50000, // elite
];

export const scoreToCategory = (score: number): FeedScoreCategory => {
  let category = 0;
  for (let i = 0; i < scoreBreakpoints.length; i++) {
    if (score < scoreBreakpoints[i]) {
      return category;
    }
    category++;
  }
  return category;
};
