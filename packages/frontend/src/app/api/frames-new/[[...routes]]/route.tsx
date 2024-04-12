/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/next';

import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { getFollowingFids, getUsers } from '@/lib/neynar';
import { getMedianScore, getSuggestedFollows } from '@/lib/score';

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
  basePath: '/api/frames-new',
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
      <div style={{ ...CONTAINER_STYLE, fontSize: 60 }}>
        how onchain is your feed?
      </div>
    ),
    intents: [<Button value="check">check</Button>],
  });
});

const showStatsFrame = async (c: any, fid: number) => {
  const followingFids = await getFollowingFids(fid);
  const medianScore = await getMedianScore(followingFids);

  const suggestedFollows = await getSuggestedFollows(followingFids);

  console.log('followingFids', followingFids.length);
  console.log('medianScore', medianScore);
  console.log(
    'suggestedFollows',
    suggestedFollows.map(({ fid, score }) => ({ fid, score }))
  );

  const suggestedUsers = await getUsers(suggestedFollows.map(({ fid }) => fid));

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',

            color: 'white',
            fontSize: 32,
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              gap: 20,
            }}
          >
            feed score:<span>{medianScore.toString()}</span>
          </div>
          <span>suggested follows</span>
          {suggestedFollows.map(({ fid, score }) => {
            const user = suggestedUsers.find(user => user.fid === fid)!;
            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyItems: 'flex-start',
                  width: '100%',
                  gap: 20,
                  margin: 20,
                }}
              >
                <img
                  src={user.pfp_url}
                  alt="profile image"
                  style={{
                    borderRadius: '50%',
                    width: 70,
                    height: 70,
                    objectFit: 'cover',
                  }}
                ></img>
                <span>{user.display_name}</span>
                <span
                  style={{
                    opacity: 0.6,
                  }}
                >
                  {score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ),
    intents: suggestedUsers.map(user => (
      <Button.Link href={`https://warpcast.com/${user.username}`}>
        {user.display_name}
      </Button.Link>
    )),
  });
};

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
