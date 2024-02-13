import neynarClient from './neynarClient';

import { FID } from './config';

import { isApiErrorResponse } from '@neynar/nodejs-sdk';

const fetch = async () => {
  try {
    const fetchResult = await neynarClient.fetchAllCastsCreatedByUser(
      Number(FID),
      {
        limit: 150,
      }
    );

    console.log(fetchResult.result.casts);
  } catch (err) {
    // Error handling, checking if it's an API response error.
    if (isApiErrorResponse(err)) {
      console.log(err.response.data);
    } else console.log(err);
  }
};

fetch();
