import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
dotenv.config({
  path: '.env.local',
});

const {
  ACCESS_TOKEN,
  ACCESS_TOKEN_SECRET,
  API_KEY,
  API_KEY_SECRET,
  PERSONAE_ACCESS_TOKEN,
  PERSONAE_ACCESS_TOKEN_SECRET,
  PERSONAE_API_KEY,
  PERSONAE_API_KEY_SECRET,
} = process.env;

if (!ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
  throw new Error('Missing ACCESS_TOKEN or ACCESS_TOKEN_SECRET');
}

if (!API_KEY || !API_KEY_SECRET) {
  throw new Error('Missing API_KEY or API_KEY_SECRET');
}

if (!PERSONAE_ACCESS_TOKEN || !PERSONAE_ACCESS_TOKEN_SECRET) {
  throw new Error(
    'Missing PERSONAE_ACCESS_TOKEN or PERSONAE_ACCESS_TOKEN_SECRET'
  );
}

if (!PERSONAE_API_KEY || !PERSONAE_API_KEY_SECRET) {
  throw new Error('Missing PERSONAE_API_KEY or PERSONAE_API_KEY_SECRET');
}

export const appClient = new TwitterApi({
  accessToken: ACCESS_TOKEN,
  accessSecret: ACCESS_TOKEN_SECRET,
  appKey: API_KEY,
  appSecret: API_KEY_SECRET,
});

// Get a user client
export const getUserClient = (accessToken: string, accessSecret: string) => {
  const client = new TwitterApi({
    accessToken,
    accessSecret,
    appKey: API_KEY,
    appSecret: API_KEY_SECRET,
  });

  return client;
};

export const personaeClient = new TwitterApi({
  accessToken: PERSONAE_ACCESS_TOKEN,
  accessSecret: PERSONAE_ACCESS_TOKEN_SECRET,
  appKey: PERSONAE_API_KEY,
  appSecret: PERSONAE_API_KEY_SECRET,
});
