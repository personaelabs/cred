/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { isRender } from '@/lib/utils';
import { Frog } from 'frog';
import { handle } from 'frog/next';

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
  basePath: '/api/frames',
  browserLocation: '/:path',
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: 'https://api.hub.wevm.dev',
  verify: isRender(),
  secret: process.env.FROG_SECRET || '',
  dev: {
    enabled: !isRender(),
  },
});

app.frame('/', c => {
  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 60,
        }}
      >
        the mint has ended
      </div>
    ),
    intents: [],
  });
});

export const GET = handle(app);
export const POST = handle(app);
