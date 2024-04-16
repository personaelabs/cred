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
  getSuggestedFollows,
} from '@/lib/score';
import { logger, isRender } from '@/lib/utils';

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

const app = new Frog({
  basePath: '/api/frames-new',
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: 'https://api.hub.wevm.dev',
  verify: isRender(),
  secret: process.env.FROG_SECRET || '',
  dev: {
    enabled: !isRender(),
  },
});

app.frame('/', async c => {
  const { buttonValue, frameData } = c;

  if (buttonValue === 'checkStats' && frameData) {
    logger.info(
      {
        fid: frameData.fid,
      },
      'check stats click'
    );
    return showStatsFrame(c, frameData.fid);
  }

  if (buttonValue === 'suggestedFollows' && frameData) {
    logger.info(
      {
        fid: frameData.fid,
      },
      'suggested follows click'
    );
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
  const averageScore = await getNonzeroAverageScore(followingFids);

  const stats = [
    {
      label: 'follows with nonzero creddd scores',
      value: `${numNonZeroFollows.toLocaleString('en-US')} / ${followingFids.length.toLocaleString('en-US')}`,
    },
    {
      label: 'follow mean creddd score',
      value: averageScore.toLocaleString('en-US'),
    },
  ];

  // Monitor the stats the users see
  logger.info(
    {
      fid,
      stats,
    },
    'feed stats'
  );

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
          stats of ppl you follow. a mean score greater than 20k is elite
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
    intents: [
      <Button value="suggestedFollows">who should I follow?</Button>,
      <Button.Link href="https://www.notion.so/personae-labs/Creddd-9cdf710a1cf84a388d8a45bf14ecfd20?pvs=4#cd4ceb802403436fab01ea1f6d5478f0">
        what is creddd score?
      </Button.Link>,
    ],
  });
};

const suggestedFollowsFrame = async (c: any, fid: number) => {
  const followingFids = await getFollowingFids(fid);
  const suggestedFollows = await getSuggestedFollows(followingFids);

  // Get user data for the suggested follows
  const suggestedUsers = await getUsers(suggestedFollows.map(({ fid }) => fid));

  // Monitor the suggested follows the users see
  logger.info(
    {
      fid,
      suggestedFollows,
    },
    'fid suggested follows'
  );

  // Get the host URL.
  // We need to be compatible with both Vercel and Render deployments,
  // because some frame urls still point to the Vercel deployments.
  const host = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.RENDER_EXTERNAL_URL
      ? process.env.RENDER_EXTERNAL_URL
      : 'http://localhost:3000';

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
            suggested follows to make your feed more onchain
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
        <Button.Link
          href={`${host}/api/warpcast-proxy/${user.username}?fid=${fid}`}
        >
          {user.display_name}
        </Button.Link>
      )),
    ].flat(),
  });
};

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
