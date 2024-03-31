/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */
import { Frog } from 'frog';
import { handle } from 'frog/vercel';
import prisma from '@/lib/prisma';
import { adminMint } from '@/lib/zora/zora';
import { getCustodyAddress } from '@/lib/neynar';

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

const CREDDD_GENESIS_TOKEN_ID = 1;

const { VERCEL_ENV } = process.env;

const app = new Frog({
  basePath: '/api/frames',
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
 * Check if the user is eligible to mint the NFT.
 */
const isEligible = async (fid: number) => {
  const attestationExists = await prisma.fidAttestation.findFirst({
    where: {
      fid,
    },
  });

  return !!attestationExists;
};

/**
 * Check if the user has already minted the NFT.
 */
const hasMinted = async (tokenId: number, fid: number) => {
  const mingLog = await prisma.mintLog.findUnique({
    where: {
      fid_tokenId: {
        fid,
        tokenId,
      },
    },
  });

  return !!mingLog;
};

app.frame('/', c => {
  const { buttonValue } = c;

  if (buttonValue === 'check') {
    return checkFrame(c);
  }

  if (buttonValue === 'about') {
    return aboutFrame(c);
  }

  if (buttonValue === 'mint') {
    return mintFrame(c);
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
        the mint has ended
      </div>
    ),
    intents: [],
  });
});

/**
 * Check if the user is eligible to mint the NFT.
 * Renders a "Mint" button if the user is eligible,
 * otherwise renders a "Add creddd" button.
 */
const checkFrame = async (c: any) => {
  const { frameData } = c;

  console.log('check fid', frameData?.fid);

  if (!frameData) {
    throw new Error('No frame data');
  }

  const alreadyMinted = await hasMinted(CREDDD_GENESIS_TOKEN_ID, frameData.fid);

  if (alreadyMinted) {
    return c.res({
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
            fontSize: 40,
          }}
        >
          the mint has ended
        </div>
      ),
      intents: [],
    });
  }

  const canMint = await isEligible(frameData.fid);

  if (canMint) {
    // The use has creddd.
    // We can mint the NFT.
    return c.res({
      action: '/',
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
            fontSize: 40,
          }}
        >
          the mint has ended
        </div>
      ),
      intents: [],
    });
  } else {
    return c.res({
      image: (
        <div
          style={{
            ...CONTAINER_STYLE,
            fontSize: 40,
          }}
        >
          the mint has ended
        </div>
      ),
      intents: [],
    });
  }
};

/**
 * Mint the NFT to the user's custody address
 * and render a "View on Zora" button.
 */
const mintFrame = async (c: any) => {
  const { frameData } = c;

  console.log('mint fid', frameData?.fid);

  if (!frameData) {
    throw new Error('No frame data');
  }

  const canMint = await isEligible(frameData.fid);

  if (!canMint) {
    throw new Error('User is not eligible to mint');
  }

  // Get the custody address of the user.
  // The NFT will be minted to this address.
  const custodyAddress = await getCustodyAddress(frameData.fid);

  // Check if the NFT has already been minted
  const alreadyMinted = await hasMinted(CREDDD_GENESIS_TOKEN_ID, frameData.fid);

  // Mint the NFT if it has not been minted already.
  if (!alreadyMinted) {
    // Mint the NFT to the custody address.
    await adminMint(custodyAddress);

    // Save the mint log.
    await prisma.mintLog.create({
      data: {
        tokenId: CREDDD_GENESIS_TOKEN_ID,
        fid: frameData.fid,
      },
    });
  }

  return c.res({
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          fontSize: 40,
        }}
      ></div>
    ),
    intents: [],
  });
};

/**
 * Render the about page.
 */
const aboutFrame = async (c: any) => {
  const { frameData } = c;

  if (!frameData) {
    throw new Error('No frame data');
  }

  return c.res({
    image: (
      <div
        style={{
          ...CONTAINER_STYLE,
          textAlign: 'center',
          fontSize: 36,
        }}
      >
        creddd is a protocol for attaching onchain reputation to your online
        identities.
        <br />
        it uses zero-knowledge proofs to prove your reputation while obscuring
        your full onchain activity.
      </div>
    ),
    intents: [],
  });
};

export const GET = handle(app);
export const POST = handle(app);
