/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
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

const { VERCEL_ENV } = process.env;
console.log('VERCEL_ENV', VERCEL_ENV);

const app = new Frog({
  basePath: '/api/rsvp-frames',
  browserLocation: '/:path',
  // Supply a Hub API URL to enable frame verification.
  hubApiUrl: 'https://api.hub.wevm.dev',
  verify: VERCEL_ENV === 'production' || VERCEL_ENV === 'preview',
  secret: process.env.FROG_SECRET || '',
  dev: {
    enabled: VERCEL_ENV !== 'production',
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
  const { buttonValue, frameData } = c;

  let fid;
  if (!frameData) {
    fid = 54; // lakshman, for debugging
  } else {
    fid = frameData.fid;
  }

  console.log('fid', fid);

  const eligible = await hasCreddd(fid);
  if (eligible) {
    if (buttonValue === 'yes' || buttonValue === 'no') {
      return rsvpedFrame(fid, buttonValue, c);
    }

    return rsvpFrame(c);
  } else {
    return getCredddFrame(c);
  }
});

const event = 'farcon-creddd';

const rsvpedFrame = async (fid: number, response: string, c: any) => {
  prisma.eventRSVPs.upsert({
    where: {
      event_fid: {
        event,
        fid,
      },
    },
    update: {
      attending: response === 'yes',
    },
    create: {
      event,
      fid,
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

const rsvpFrame = async (c: any) => {
  // NOTE: we'll enable multi-RSVP. so you can RSVP to overwrite past choice
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
        evening of 5/4 at a (to be disclosed) location. <br />
        will you be there?
      </div>
    ),

    intents: [<Button value="yes">yes</Button>, <Button value="no">no</Button>],
  });
};

const getCredddFrame = async (c: any) => {
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
        add creddd for a secret message <br />
      </div>
    ),
    intents: [<Button.Link href="https://creddd.xyz">add creddd</Button.Link>],
  });
};

export const GET = handle(app);
export const POST = handle(app);
