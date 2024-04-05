/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { getUser } from '@/lib/neynar';
import { getUserScore } from '@/lib/score';
import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';

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

const { RENDER } = process.env;

const app = new Frog({
  basePath: '/api/score-frame',
  browserLocation: '/:path',
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: 'https://api.hub.wevm.dev',
  verify: RENDER === 'true',
  secret: process.env.FROG_SECRET || '',
  dev: {
    enabled: RENDER !== 'true',
  },
});

app.frame('/', c => {
  const { buttonValue } = c;

  if (buttonValue === 'check') {
    return checkScoreFrame(c);
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
        check your creddd score
      </div>
    ),
    intents: [<Button value="check">check</Button>],
  });
});

const checkScoreFrame = async (c: any) => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  console.log('fid', frameData.fid);

  const user = await getUser(frameData.fid);
  const score = await getUserScore(frameData.fid);

  if (!user) {
    return c.res({
      action: '/',
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
            fontSize: 60,
          }}
        >
          User not found
        </div>
      ),
      intents: [<Button value="">Reload</Button>],
    });
  }

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <img
            src={user.pfp_url}
            alt="profile image"
            style={{
              borderRadius: '50%',
              width: 100,
              height: 100,
              objectFit: 'cover',
            }}
          ></img>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
              fontSize: 40,
            }}
          >
            <span>{user.display_name}</span>
            <span
              style={{
                opacity: 0.6,
              }}
            >
              CREDDD SCORE: <span>{score}</span>
            </span>
          </div>
        </div>
      </div>
    ),
    intents: [
      <Button.Link href="https://creddd.xyz/search">Add more</Button.Link>,
    ],
  });
};

export const GET = handle(app);
export const POST = handle(app);
