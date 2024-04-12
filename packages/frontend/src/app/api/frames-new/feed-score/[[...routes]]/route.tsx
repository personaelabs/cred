/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/next';

import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';

const TEXT_COLOR = '#FDA174';
const CONTAINER_STYLE = {
  color: TEXT_COLOR,
  backgroundColor: '#1E1E1E',
  display: 'flex',
  flexDirection: 'column' as any,
  width: '100%',
  paddingLeft: 60,
  paddingRight: 60,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 40,
  borderColor: TEXT_COLOR,
};

const { VERCEL_ENV } = process.env;

const app = new Frog({
  basePath: '/api/frames-new/feed-score',
  browserLocation: '/:path',
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: 'https://api.hub.wevm.dev',
  verify: VERCEL_ENV === 'production' || VERCEL_ENV === 'preview',
  secret: process.env.FROG_SECRET || '',
  dev: {
    enabled: VERCEL_ENV !== 'production',
  },
});

// TODO: finish flow
// 1. how onchain is your feed? (intents: check)
// 2. show feed stats (intents: what is the creddd score?, who should I follow?)
//     - {num nonzero} / {num zero}
//     - mean nonzero, median nonzero (because most accounts today are zero score)
//     - fid with the top score (with profile pic?)
// 3. show 3 accounts to follow to increase mean score
//     - ideally, with slightly different creddd
//     - track follow clicks
app.frame('/', async c => {
  const { buttonValue, frameData } = c;

  if (buttonValue === 'check' && frameData) {
    console.log('check score click', frameData.fid);
    return showStatsFrame(c, frameData.fid);
  }

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 60,
        }}
      >
        how onchain is your feed?
      </div>
    ),
    intents: [<Button value="check">check</Button>],
  });
});

const showStatsFrame = async (c: any, fid: number) => {
  // const followingFids = await getFollowingFids(fid);
  // TODO: calculate score stats of following fids

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 60,
        }}
      >
        score here for {fid}
      </div>
    ),
    intents: [],
  });
};

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
