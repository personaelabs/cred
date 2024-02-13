import neynarClient from './neynarClient';
import { SIGNER_UUID, NEYNAR_API_KEY } from './config';
import { isApiErrorResponse } from '@neynar/nodejs-sdk';

const postGm = async () => {
  try {
    await neynarClient.publishCast(SIGNER_UUID, 'gm');
    console.log('Cast published successfully');
  } catch (err) {
    // Error handling, checking if it's an API response error.
    if (isApiErrorResponse(err)) {
      console.log(err.response.data);
    } else console.log(err);
  }
};

postGm();
