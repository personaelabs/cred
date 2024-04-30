import axios from 'axios';
import { getSuggestedFollows } from './score';

async function getActiveFids() {
  const resp = await axios.get('https://api.warpcast.com/v2/power-badge-users');

  if (!resp.data) {
    console.log(`Error fetching active fids: ${resp}`);
    return [];
  }

  return resp.data.result.fids;
}

let ACTIVE_FIDS: number[] = [];
getActiveFids().then((fids: number[]) => {
  ACTIVE_FIDS = fids;
});

export async function getActiveSuggestedFollows(
  followingFids: number[],
  take: number = 3
) {
  const allSuggested = await getSuggestedFollows(followingFids);
  const activeAllSuggested = allSuggested.filter(({ fid }) =>
    ACTIVE_FIDS.includes(fid)
  );

  console.log(`found ${activeAllSuggested.length} active suggested follows`);

  return activeAllSuggested.slice(0, take);
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
