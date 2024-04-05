/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/next';
import prisma from '@/lib/prisma';

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
const IS_RENDER = RENDER === 'true';

const app = new Frog({
  basePath: '/api/rsvp-frames',
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: 'https://api.hub.wevm.dev',
  verify: IS_RENDER,
  secret: process.env.FROG_SECRET || '',
  dev: {
    enabled: !IS_RENDER,
  },
});

/**
 * Check if the user has any creddd
 */
const hasCreddd = async (fid: number) => {
  const attestationExists = await prisma.fidAttestation.findFirst({
    where: {
      fid,
    },
  });

  return !!attestationExists;
};

app.frame('/', async c => {
  const { buttonValue } = c;

  if (buttonValue === 'check') {
    return rsvpOrGetCredddFrame(c);
  }

  if (buttonValue === 'yes' || buttonValue === 'no') {
    return rsvpedFrame(buttonValue, c);
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
        a secret message for a select few...
      </div>
    ),
    intents: [<Button value="check">check eligibility</Button>],
  });
});

const event = 'farcon-creddd';

const rsvpedFrame = async (response: string, c: any) => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  await prisma.eventRSVPs.upsert({
    where: {
      event_fid: {
        event,
        fid: frameData.fid,
      },
    },
    update: {
      attending: response === 'yes',
    },
    create: {
      event,
      fid: frameData.fid,
      attending: response === 'yes',
    },
  });

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 40,
        }}
      >
        rsvp recorded. see you there
      </div>
    ),

    intents: [<Button.Reset>change response</Button.Reset>],
  });
};

const rsvpOrGetCredddFrame = async (c: any) => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  const eligible = await hasCreddd(frameData.fid);

  if (eligible) {
    return c.res({
      action: '/',
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
            fontSize: 40,
          }}
        >
          you`re invited to a secret event at farcon. <br />
          the evening of 5/4 at a (to be disclosed) location. <br />
          will you be there?
        </div>
      ),

      intents: [
        <Button value="yes">yes</Button>,
        <Button value="no">no</Button>,
      ],
    });
  } else {
    return c.res({
      action: '/',
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
            fontSize: 40,
          }}
        >
          no creddd detected <br />
          not eligible
        </div>
      ),
      intents: [
        <Button.Link href="https://creddd.xyz">add creddd</Button.Link>,
      ],
    });
  }
};

export const GET = handle(app);
export const POST = handle(app);
