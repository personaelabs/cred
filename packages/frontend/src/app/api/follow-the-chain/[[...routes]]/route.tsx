/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/next';

import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { getFollowingFids, getUsers } from '@/lib/neynar';
import { logger, getFrogConfig } from '@/lib/utils';
import {
  FeedScoreCategory,
  categoryToFrameInfo,
  getActiveSuggestedFollows,
  scoreToCategory,
} from '@/lib/feedScore';
import { getAverageScore } from '@/lib/score';

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

const app = new Frog(getFrogConfig('/api/follow-the-chain'));

app.frame('/', async c => {
  // NOTE: for testing
  // return checkFeedFrame(c, 54);
  // return suggestedFollowsFrame(c, 54);

  const { buttonValue, frameData } = c;

  if (buttonValue === 'checkFeed' && frameData) {
    logger.info('check feed click', {
      fid: frameData.fid,
    });
    return checkFeedFrame(c, frameData.fid);
  }

  if (buttonValue === 'suggestedFollows' && frameData) {
    logger.info('suggested follows click', {
      fid: frameData.fid,
    });
    return suggestedFollowsFrame(c, frameData.fid);
  }

  return c.res({
    action: '/',
    image: (
      <div style={{ ...CONTAINER_STYLE, fontSize: 48 }}>
        <span style={{ textAlign: 'center' }}>
          as crypto heats up, you need to know who to follow
        </span>
        <hr />
        <span>use this tool to follow the chain...</span>
      </div>
    ),
    intents: [<Button value="checkFeed">check your feed</Button>],
  });
});

// display group, score, recommended follows
// as well as 'what is score?' link
const checkFeedFrame = async (c: any, fid: number) => {
  const followingFids = await getFollowingFids(fid);
  const feedScore = await getAverageScore(followingFids);

  const category: FeedScoreCategory = scoreToCategory(feedScore);
  const frameInfo = categoryToFrameInfo[category];

  // Monitor the stats the users see
  logger.info('feed score', {
    fid,
    feedScore,
  });

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            fontSize: 48,
            whiteSpace: 'pre',
          }}
        >
          your feed is
          <span
            style={{
              color: frameInfo.color,
            }}
          >
            {' '}
            {frameInfo.label} (avg. onchain score= {feedScore})
          </span>
        </span>
        <hr />

        <span
          style={{
            fontSize: 36,
          }}
        >
          {frameInfo.msg}
        </span>
        <hr />

        {category !== FeedScoreCategory.ELITE && (
          <span
            style={{
              fontSize: 36,
              whiteSpace: 'pre',
            }}
          >
            we have some suggestisons for you...
          </span>
        )}

        <hr />
      </div>
    ),
    intents: [
      <Button value="suggestedFollows">suggested follows</Button>,
      // TODO: fill in this notion
      <Button.Link href="">what is onchain score?</Button.Link>,
    ],
  });
};

const suggestedFollowsFrame = async (c: any, fid: number) => {
  const followingFids = await getFollowingFids(fid);

  const suggestedFollows = await getActiveSuggestedFollows(followingFids);
  const suggestedUsers = await getUsers(suggestedFollows.map(({ fid }) => fid));

  // Monitor the suggested follows the users see
  logger.info('fid suggested follows', {
    fid,
    suggestedFollows,
  });

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
            follow these extremely onchain accounts:
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
                    justifyContent: 'space-between',
                    width: '100%',
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
                      paddingRight: 60, // jank, but it works...
                    }}
                  >
                    <span>onchain score:</span>
                    <span
                      style={{
                        alignItems: 'flex-end',
                      }}
                    >
                      {Number(score).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    intents: [
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
