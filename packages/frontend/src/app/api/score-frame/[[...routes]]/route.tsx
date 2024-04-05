/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { getUser } from '@/lib/neynar';
import { getUserScore } from '@/lib/score';
import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';

const { VERCEL_ENV } = process.env;

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
  // Supply a Hub API URL to enable frame verification.
  verify: VERCEL_ENV === 'production' || VERCEL_ENV === 'preview',
  basePath: '/api/score-frame',
  hubApiUrl: 'https://api.hub.wevm.dev',
  secret: process.env.FROG_SECRET || '',
  dev: {
    enabled: VERCEL_ENV !== 'production',
  },
});

app.frame('/', c => {
  c.url.replace(':10000', '');
  const { buttonValue, frameData } = c;

  if (buttonValue === 'check' && frameData) {
    return checkScoreFrame(c, frameData.fid);
  }

  return c.res({
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

app.frame('/user/:fid', c => {
  c.url.replace(':10000', '');
  const { fid } = c.req.param();

  return checkScoreFrame(c, parseInt(fid));
});

const checkScoreFrame = async (c: any, fid: number) => {
  const user = await getUser(fid);
  const score = await getUserScore(fid);

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

  const shareLink = `https://warpcast.com/~/compose?text=Check your creddd score&embeds[]=https://${process.env.VERCEL_URL}/api/score-frame/user/${fid}`;

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
              CREDDD SCORE: <span>{Math.round(score).toString()}</span>
            </span>
          </div>
        </div>
      </div>
    ),
    intents: [
      <Button value="check">Check my score</Button>,
      <Button.Link href={shareLink}>Share</Button.Link>,
      <Button.Link href="https://creddd.xyz/search">Add creddd</Button.Link>,
    ],
  });
};

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
