/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/next';

import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { getFollowingFids, getUsers } from '@/lib/neynar';
import {
  getNonZeroFollowCount,
  getNonzeroAverageScore,
  getNonzeroMedianScore,
  getSuggestedFollows,
} from '@/lib/score';

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

  if (buttonValue === 'checkStats' && frameData) {
    console.log('check stats click', frameData.fid);
    return showStatsFrame(c, frameData.fid);
  }

  if (buttonValue === 'suggestedFollows' && frameData) {
    console.log('suggested follows click', frameData.fid);
    return suggestedFollowsFrame(c, frameData.fid);
  }

  return c.res({
    action: '/',
    image: (
      <div style={{ ...CONTAINER_STYLE, fontSize: 60 }}>
        how onchain is your feed?
      </div>
    ),
    intents: [<Button value="checkStats">check</Button>],
  });
});

const showStatsFrame = async (c: any, fid: number) => {
  const followingFids = await getFollowingFids(fid);

  const numNonZeroFollows = await getNonZeroFollowCount(followingFids);
  const medianScore = await getNonzeroMedianScore(followingFids);
  const averageScore = await getNonzeroAverageScore(followingFids);

  const stats = [
    {
      label: 'users with nonzero scores',
      value: `${numNonZeroFollows.toLocaleString('en-US')} / ${followingFids.length.toLocaleString('en-US')}`,
    },
    {
      label: 'mean score',
      value: averageScore.toLocaleString('en-US'),
    },
    {
      label: 'median score',
      value: medianScore.toLocaleString('en-US'),
    },
  ];

  // Monitor the stats the users see
  console.log('fid stats', fid, stats);

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          alignItems: 'flex-start',
          gap: 30,
        }}
      >
        <span
          style={{
            fontSize: 48,
          }}
        >
          your feed stats
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',

            color: 'white',
            fontSize: 40,
            width: '100%',
            gap: 16,
          }}
        >
          {stats.map(({ label, value }) => (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                gap: 20,
              }}
            >
              <span
                style={{
                  opacity: 0.6,
                }}
              >
                {label}
              </span>
              :
              <span
                style={{
                  fontWeight: 'bold',
                  color: TEXT_COLOR,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    intents: [<Button value="suggestedFollows">who should I follow?</Button>],
  });
};

const suggestedFollowsFrame = async (c: any, fid: number) => {
  const followingFids = await getFollowingFids(fid);
  const suggestedFollows = await getSuggestedFollows(followingFids);

  // Get user data for the suggested follows
  const suggestedUsers = await getUsers(suggestedFollows.map(({ fid }) => fid));

  // Monitor the suggested follows the users see
  console.log('fid suggested follows', fid, suggestedFollows);

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
            width: '100%',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 40,
              color: TEXT_COLOR,
            }}
          >
            suggested follows
          </span>
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
                  gap: 16,
                  fontSize: 28,
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
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    fontSize: 32,
                    gap: 32,
                  }}
                >
                  <span>{user.display_name}</span>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      opacity: 0.6,
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span>creddd score:</span>
                    <span>{Number(score).toLocaleString('en-US')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    intents: [
      <Button value="checkStats">back</Button>,
      suggestedUsers.map(user => (
        <Button.Link href={`https://warpcast.com/${user.username}`}>
          {user.display_name}
        </Button.Link>
      )),
    ].flat(),
  });
};

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);