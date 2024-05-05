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
  fid: number,
  followingFids: number[],
  take: number = 3
) {
  const allSuggested = await getSuggestedFollows(
    followingFids.concat([fid]),
    ACTIVE_FIDS,
    3
  );
  console.log(`found ${allSuggested.length} active suggested follows`);

  return allSuggested.slice(0, take);
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

const scoreBreakpoints = [
  1000, // mid
  2000, // degenerate
  10000, // elite
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
