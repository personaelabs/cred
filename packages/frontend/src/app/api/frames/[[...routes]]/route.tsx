/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { getFrogConfig } from '@/lib/utils';
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

const app = new Frog(getFrogConfig('/api/frames'));

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
